/* eslint-disable camelcase */
const request     = require('request');
const express     = require('express');
const bodyParser  = require('body-parser');
const parser      = require('./src/parser');
const db          = require('./src/db');
const {WebClient} = require('@slack/client');

const app = express();
const web = new WebClient(process.env.SLACK_APP_OAUTH);

/* Settings of the server */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('port', (process.env.PORT || 9001));

/* End Settings */
/* Send a get request to check if the server is up and running */
app.get('/', (req, res) => res.send('Askia slackbot up and running\n'));

/* Display the poll */
app.post(
  '/post',
  ({body:{token, user_id, text, response_url, channel_id}}, res) => {
    if (token !== process.env.SLACK_APP_TOKEN) {
      log('Invalid token', token);
      res.status(403).end('Access forbidden');
    }
    else {
      const data = parser.parse(text);

      if (3 > data._.length) {
        web.chat.postEphemeral({
          channel: channel_id,
          user   : user_id,
          text   : 'Not enough values found'
        });
      }
      else {
        db
          .create(user_id, channel_id, data)
          .then(poll =>
            slackMessage(response_url, pollMsg(poll))
              .then(_ => res.status(200).end())
              .catch(err => {
                log("Post failure", err);
                res.status(500).end();
              })
          );
      }
    }
  }
);

/* Manage the update of the poll list */
app.post(
  '/actions',
  bodyParser.urlencoded({extended: false}),
  (req, res) => {
    const {body: {payload}} = req;
    const {
      actions: [action],
      channel,
      callback_id,
      response_url,
      user
    } = JSON.parse(payload);
    const match  = /askia_poll_([a-z0-9]+)/.exec(callback_id);
    const pollId = match !== null ? match[1] : undefined;

    db.get(pollId)
      .then(poll => {
        const actionId = parseInt(action.name, 10);
        const response = poll !== undefined
          ? poll.responses.find(x => x.name === actionId)
          : undefined;

        if (response !== undefined) {
          const index = response.users.indexOf(user.name);
          let r;

          if (0 === poll.limit) {
            r = {
              [`responses.${poll.responses.indexOf(response)}`]: {
                ...(index === -1
                  ? {
                    ...response,
                    votes: response.votes + 1,
                    users: [...response.users, user.name]
                  }
                  : {
                    ...response,
                    votes: response.votes - 1,
                    users: [
                      ...response.users.slice(0, index),
                      ...response.users.slice(
                        index + 1,
                        response.users.length
                      )
                    ]
                  }
                )
              }
            };
          }
          else {
            const index = response.users.indexOf(user.name);

            if (index !== -1) {
              r = {
                [`responses.${poll.responses.indexOf(response)}`]: {
                  ...response,
                  votes: response.votes - 1,
                  users: [
                    ...response.users.slice(0, index),
                    ...response.users.slice(
                      index + 1,
                      response.users.length
                    )
                  ]
                }
              };
            }
            else if (poll.limit > poll.responses.filter(x =>
              x.users.includes(user.name)).length) {
              r = {
                [`responses.${poll.responses.indexOf(response)}`]: {
                  ...response,
                  votes: response.votes + 1,
                  users: [...response.users, user.name]
                }
              };
            }
            else {
              throw new Error('Max number of responses limit reached');
            }
          }

          return db
            .update(pollId, r)
            .then(_ => db.get(pollId))
            .then(poll => slackMessage(response_url, pollMsg(poll, true))
              .then(_ => res.status(200).end())
            );
        }
        else {
          throw new Error('Undefined response');
        }
      })
      .catch(err => {
        web.chat.postEphemeral({
          channel: channel.id,
          user   : user.id,
          text   : err.message
        });

        res.status(200).end();
      });
  }
);

app.listen(app.get('port'), () => log('Listen port', app.get('port')));

/**
 * Default post options used by {@link slackMessage}.
 *
 * @type {Request}
 */
const postOptions = {
  method : 'POST',
  headers: {
    'Content-type': 'application/json; charset=utf-8'
  }
};

/**
 * Create a simple request to the Slack API which returns a `Promise`
 * of the request response.
 *
 * @template a
 * @type {(String, Request) -> Promise a}
 */
const slackMessage = (uri, json) => new Promise((res, rej) => request(
  {...postOptions, uri, json},
  (error, response, body) => error
    ? rej(error)
    : res({response, body})
));

/**
 * Creates the slack poll request obje.
 *
 * @type {Poll -> SlackRequest}
 */
const pollMsg = (poll, replaceOrignal = false) => ({
  "response_type"   : "in_channel",
  "replace_original": replaceOrignal,
  "text"            : renderResponses(poll),
  "attachments"     : [
    ...poll.responses.reduce(
      (xs, response, i) => 0 === i % 5
        ? [...xs, createSlackAttachment(poll, response)]
        : [...xs.slice(0, -1), addAttachmentAction(last(xs), response)],
      []
    )
  ]
});

/**
 * Creates a {@link SlackAttachment} object for a given {@link Poll} object
 * with the specified response bounded as attachement action.
 *
 * @param {Poll} poll
 * The poll for which the attachement is create.
 *
 * @param {PollResponse} response
 * The response to bind as an attachement action.
 *
 * @returns {SlackAttachment}
 * Returns the created slack attachment oject.
 */
const createSlackAttachment = (poll, response) => ({
  "fallback"       : "Cannot display the responses",
  "callback_id"    : callbackId(poll._id),
  "color"          : "#283B49",
  "attachment_type": "default",
  "actions"        : [response]
});

/**
 * Binds an action `x` to a SlackAttachement object `o`.
 *
 * @param {SlackAttachement} attachment
 * The attachment where you want to add the action
 *
 * @param {PollResponse} response
 * The poll response object to add as an attachment action.
 *
 * @returns {SlackAttachment}
 * Returns the modified attachment object.
 */
const addAttachmentAction = (attachment, response) => ({
  ...attachment,
  "actions": [...attachment.actions, response]
});

/**
 * Renders the responses of the poll text message.
 *
 * @param {Poll} poll
 * The poll object to render.
 */
const renderResponses = poll => [
  '*'.concat(poll.question).concat('*'),
  '',
  ...poll.responses
    .slice()
    .sort(sorter)
    .map(renderResponse(poll))
].join('\n');

/**
 * Renders a {@link PollResponse} object.
 *
 * @param {Poll} poll
 * The poll context to wich the response belongs.
 *
 * @param {PollResponse}
 * The poll response object to render
 *
 * @returns {string}
 * Returns the rendered response.
 */
const renderResponse = (poll, response) => [
  `• *${response.text}* \`${response.votes}\``,
  `${renderUsers(poll, response.users)}`
].join('\n');

/**
 * Renders the list of `users` depending of the `poll` context.
 *
 * @param {string[]} response
 * The list of users to render.
 *
 * @param {Poll} poll
 * The poll context to the which the response belongs to.
 *
 * @returns {string}
 * Returns the rendered list of users.
 */
const renderUsers = (poll, users) => !poll.anonymous
  ? users.map(user => `_${user}_`).join(', ')
  : '';

/**
 * Get the slack callback unique identifier from an int value.
 *
 * @param {number} i
 * The int value from which to get the callback id.
 *
 * @returns {string}
 * Returns the slack callback unique identifier.
 */
const callbackId = i => `${CALLBACK_ID_PREFIX}${i}`;

/**
 * Prefix for all slack callback unique identifiers.
 *
 * @type {string}
 */
const CALLBACK_ID_PREFIX = "askia_poll_";

/**
 * Represent the `greater` ordering value.
 *
 * @type {number}
 */
const GT = -1;

/**
 * Represent the `greater` ordering value.
 *
 * @type {number}
 */
const LT = +1;

/**
 * Represent the `greater` ordering value.
 *
 * @type {number}
 */
const EQ = 0;

/**
 * Gets an ordering value for a specified {@link PollResponse} `x`
 * compared to another existing {@link PollResponse} `y`.
 *
 * @param {PollResponse} x
 * The poll response to for which we get the ordering value.
 *
 * @param {PollResponse} y
 * The poll response which used as ordering comparison.
 *
 * @returns {number}
 * Returns an ordering int value between `-1` and `+1`.
 */
const sorter = (x, y) => {
  if (x.votes > y.votes) return GT;
  if (x.votes < y.votes) return LT;
  return EQ;
};

const last = xs => xs[xs.length - 1];

/**
 * Shorthand to `console.log()`.
 */
const log = (...xs) => console.log(...xs);

