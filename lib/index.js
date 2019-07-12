/* eslint-disable camelcase */
import {WebClient}                      from "@slack/client";
import express                          from "express";
import bodyParser                       from "body-parser";
import https                            from "https";
import path                             from "path";
import fs                               from "fs";
import slackify                         from "slackify-markdown";
import * as poll                        from "./model/poll.js";
import * as polls                       from "./store/poll.js";
import * as teams                       from "./store/team.js";
import * as view                        from "./view/poll.js";
import * as vote                        from "./action/vote.js";
import * as cmd                         from "./cmd.js";
import {pollIdFrom, responseFromAction} from "./util.js";

/* Settings of the Slack API */
const web = new WebClient();

/* Settings of the server */
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('port', process.env.PORT);

/* SSL credentials */
const credentials = {
  "key": fs.readFileSync(process.env.SSL_KEY),
  "cert": fs.readFileSync(process.env.SSL_CERT),
  "ca": fs.readFileSync(process.env.SSL_CHAIN)
};

/* Help text */
const help = slackify(fs.readFileSync(
  path.resolve(__dirname, "../Help.md"),
  {encoding: "utf8"}
));

/**
 * Handles slack authentication with app redirection pages.
 */
app.get("/slack/auth/redirect", (req, res) => {
  if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET) {
    res.status(500).send("Missing CLIENT_ID or CLIENT_SECRET");
  }
  else {
    web.oauth
      .access({
        "code": req.query.code,
        "client_id": process.env.SLACK_CLIENT_ID,
        "client_secret": process.env.SLACK_CLIENT_SECRET
      })
      .then(handleResponse)
      .then(resp => teams.create({
        "teamId": resp.team_id,
        "token": resp.access_token
      }))
      .then(_ => res.status(200).end("Success!"))
      .catch(e => res.status(200).end(`Slack error: ${e.message}`));
  }
});

/**
 * Handles the command line input. The commands are received from
 * the Slack API and response are also returns to the Slack API.
 */
app.post("/post", (req, res) => {
  const {body: {token, user_id, team_id, channel_id, text}} = req;

  if (token !== process.env.SLACK_APP_TOKEN) {
    res.status(403).end("Access forbidden");
  }
  else {
    cmd
      .parse(text)
      .then(argv => argv.help
        ? showHelp(team_id, user_id, channel_id)
        : showPoll(team_id, user_id, channel_id, argv)
      )
      .then(_ => res.status(200).end())
      .catch(err => sendError(res, {
        "channel": channel_id,
        "user": user_id,
        "text": err.message
      }));
  }
});

/**
 * Handles user actions on polls. These actions are received from the
 * Slack API and responses are alse returned to the Slack API.
 */
app.post("/actions", bodyParser.urlencoded({extended: false}), (req, res) => {
  const {body: {payload}} = req;
  const {actions: [action], callback_id, team, user, channel} =
    JSON.parse(payload);

  pollIdFrom(callback_id)
    .then(id => polls.get(id))
    .then(p => responseFromAction(action, p)
      .then(x => vote.dispatch(user, p, x))
      .then(x => polls.update(p._id, x))
      .then(p => view.create(p))
    )
    .then(poll => teams
      .get(team.id)
      .then(team => [poll, team ? team.token : null])
    )
    .then(([msg, token]) => web.chat.update({
      token,
      ...msg
    }))
    .then(handleResponse)
    .then(_ => res.status(200).end())
    .catch(err => sendError(res, {
      "channel": channel.id,
      "user": user.id,
      "text": err.message
    }));
});

/* Start the server on specified port */
const server = https.createServer(credentials, app);
server.listen(app.get("port"));

/* Show help message */
const showHelp  = (teamId, userId, channelId) => teams
  .get(teamId)
  .then(team => team ? team.token : null)
  .then(token => web.chat.postEphemeral({
    "channel": channelId,
    "user": userId,
    "text": help,
    token
  }));

/** Show poll message */
const showPoll = (team_id, user_id, channel_id, argv) => polls
  .create(poll.from(user_id, channel_id, argv))
  .then(poll => teams
    .get(team_id)
    .then(team => [poll, team ? team.token : null])
  )
  .then(([poll, token]) => web.chat
    .postMessage({
      token,
      ...view.create(poll)
    })
    .then(handleResponse)
    .then(x => polls.update(poll._id, {"messageTs": x.ts}))
  );

/**
 * Sends an error message to the Slack client.
 */
const sendError = (res, message) => web.chat
  .postEphemeral(message)
  .then(_ => res.status(200).end())
  .catch(e => (console.error(e), res.status(500).end(e.message)));

/**
 * Handles a slack response object. The response is rejected if the Slack API
 * returns `ok` to `false`.
 *
 * @param {SlackRequestResponse} response
 * The slack request response to check.
 *
 * @returns {Promise<SlackRequestResponse>}
 * Returns the slack request response.
 */
const handleResponse = response =>
  new Promise((resolve, reject) => response.ok
    ? resolve(response)
    : reject(new Error(response.error || "An error occurs on Slack API"))
  );
