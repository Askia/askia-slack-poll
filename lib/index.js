/* eslint-disable camelcase */
import {WebClient}                      from "@slack/client";
import express                          from "express";
import bodyParser                       from "body-parser";
import https                            from "https";
import path                             from "path";
import fs                               from "fs";
import slackify                         from "slackify-markdown";
import * as db                          from "./db.js";
import * as cmd                         from "./cmd.js";
import * as poll                        from "./poll.js";
import {createSlackMessage}             from "./message.js";
import * as vote                        from "./vote.js";
import {pollIdFrom, responseFromAction} from "./util.js";

/* Settings of the Slack API */
const web = new WebClient(process.env.SLACK_APP_OAUTH);

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
 * Handles the command line input. The commands are received from
 * the Slack API and response are also returns to the Slack API.
 */
app.post(`/post`, (req, res) => {
  const {body: {token, user_id, text, channel_id}} = req;

  if (token !== process.env.SLACK_APP_TOKEN) {
    res.status(403).end("Access forbidden");
  }
  else {
    cmd
      .parse(text)
      .then(argv => argv.help
        ? showHelp(res, user_id, channel_id)
        : showPoll(res, user_id, channel_id, argv)
      );
  }
});

/**
 * Handles user actions on polls. These actions are received from the
 * Slack API and responses are alse returned to the Slack API.
 */
app.post(`/actions`, bodyParser.urlencoded({extended: false}), (req, res) => {
  const {body: {payload}} = req;
  const {actions: [action], channel, callback_id, user} = JSON.parse(payload);

  pollIdFrom(callback_id)
    .then(id => db.get(id))
    .then(p => responseFromAction(action, p)
      .then(x => vote.dispatch(user, p, x))
      .then(x => db.update(p._id, x))
      .then(p => createSlackMessage(p))
    )
    .then(msg => web.chat.update(msg))
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
const showHelp  = (res, user_id, channel_id) => web.chat
  .postEphemeral({
    "channel": channel_id,
    "user": user_id,
    "text": help
  })
  .then(_ => res.status(200).end())
  .catch(err => sendError(res, {
    "channel": channel_id,
    "user": user_id,
    "text": err.message
  }));

/** Show poll message */
const showPoll = (res, user_id, channel_id, argv) => db
  .create(poll.from(user_id, channel_id, argv))
  .then(p => web.chat
    .postMessage(createSlackMessage(p))
    .then(handleResponse)
    .then(x => db.update(p._id, {"messageTs": x.ts}))
  )
  .then(_ => res.status(200).end())
  .catch(err => sendError(res, {
    "channel": channel_id,
    "user": user_id,
    "text": err.message
  }));

/**
 * Sends an error message to the Slack client.
 */
const sendError = (res, message) => web.chat
  .postEphemeral(message)
  .then(_ => res.status(200).end())
  .catch(_ => res.status(500).end());

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
