/* eslint-disable camelcase */
const request    = require('request');
const express    = require('express');
const bodyParser = require('body-parser');
const parser     = require('./src/parser');
const db         = require('./src/db');

const app = express();

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
        res.status(400).end('Not enough values found');
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
  ({body: {payload}}, res) => {
    const {
      actions: [action],
      callback_id,
      response_url,
      user: {name}
    } = JSON.parse(payload);
    const match    = /askia_poll_([a-z0-9]+)/.exec(callback_id);
    const pollId   = match !== null ? match[1] : undefined;

    db
      .get(pollId)
      .then(poll => {
        const actionId = parseInt(action.name, 10);
        const response = poll !== undefined
          ? poll.responses.find(x => x.name === actionId)
          : undefined;

        if (response !== undefined) {
          const index = response.users.indexOf(name);
          let r;

          if (0 === poll.limit) {
            r = {
              [`responses.${poll.responses.indexOf(response)}`]: {
                ...(index === -1
                  ? {
                    ...response,
                    votes: response.votes + 1,
                    users: [...response.users, name]
                  }
                  : {
                    ...response,
                    votes: response.votes - 1,
                    users: [
                      ...response.users.slice(0, index),
                      ...response.users.slice(index + 1, response.users.length)
                    ]
                  }
                )
              }
            };
          }
          else {
            const index = response.users.indexOf(name);

            if (index !== -1) {
              r = {
                ...response,
                votes: response.votes - 1,
                users: [
                  ...response.users.slice(0, index),
                  ...response.users.slice(index + 1, response.users.length)
                ]
              };
            }
            else if (poll.limit > poll.responses.find(x =>
              x.users.includes(name).length)) {
              r = {
                ...response,
                votes: response.votes + 1,
                users: [...response.users, name]
              };
            }
          }

          return db
            .update(pollId, r)
            .then(_ => db.get(pollId))
            .then(poll => slackMessage(response_url, pollMsg(poll, true))
              .then(_ => res.status(200).end())
              .catch(err => {
                err.code = 500;
                throw err;
              })
            );
        }
        else {
          const err = new Error('Undefined response');

          err.code = 404;
          throw err;
        }
      })
      .catch(err => {
        if ('code' in err) {
          res.status(err.code).end(err.message);
        }
        else {
          res.status(404).end('Poll does not exist anymore');
        }
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
const pollMsg = (x, replaceOrignal = false) => ({
  "response_type"   : "in_channel",
  "replace_original": replaceOrignal,
  "text"            : pollTpl(x),
  "attachments"     : [
    ...x.responses.reduce(
      (prev, y, i) => 0 === i % 5
        ? [
          ...prev,
          {
            "fallback"       : "Cannot display the responses",
            "callback_id"    : `askia_poll_${x._id}`,
            "color"          : "#283B49",
            "attachment_type": "default",
            "actions"        : [y]
          }
        ]
        : [
          ...prev.slice(0, -1),
          bindAction(prev[prev.length - 1], y)
        ],
      []
    )
  ]
});

/**
 * Binds an action `x` to a SlackAttachement object `o`
 *
 * @param {SlackAttachement} o
 * The attachment where you want to add the action
 *
 * @param {Action} x
 * The action object to attach
 *
 * @returns {SlackAttachement}
 * Returns the modified attachment object.
 */
const bindAction = (o, x) => ({
  ...o,
  actions: [...o.actions, x]
});

/**
 * Creates the poll text message.
 *
 * @type {Poll -> String}
 */
const pollTpl = x => [
  '*'.concat(x.question).concat('*'),
  '',
  ...x.responses
    .slice()
    .sort(sorter)
    .map(y =>
      `• *${y.text}* \`${y.votes}\`\n${handleUsersDisplay(y, x.anonymous)}`)
].join('\n');

const handleUsersDisplay = (y, b) => !b
  ? y.users.map(el => '_'.concat(el).concat('_')).join(', ')
  : '';

/**
 * Sorter function for poll response items organized by votes.
 *
 * @type {(Response, Response) -> Int}
 */
const sorter = (x, y) => {
  if (x.votes > y.votes) return -1;
  if (x.votes < y.votes) return +1;
  return 0;
};

/**
 * Shorthand to `console.log()`.
 */
const log = (...xs) => console.log(...xs);

