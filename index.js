const request    = require('request');
const express    = require('express');
const bodyParser = require('body-parser');
const parser     = require('./src/parser');
const db         = require('./src/db');

const app = express();

console.log("test");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port', (process.env.PORT || 9001));
app.get('/', (req, res) => res.send('Askia slackbot up and running\n'));

app.post(
  '/post',
  /* eslint-disable-next-line */
  ({body:{token, user_id, text, response_url, channel_id}}, res) => {
    if (token !== process.env.SLACK_APP_TOKEN) {
      log('Invalid token', token);
      res.status(403).end('Access forbidden');
    }
    else {
      const xs = parser.parse(text);
      console.log(user_id);
      if (3 > xs.length) {
        res.status(400).end('Not enough values found');
      }
      else {
        const poll = db.generate(user_id, channel_id, xs);

        slackMessage(response_url, pollMsg(poll))
          .then(_ => res.status(200).end())
          .catch(err => {
            log("Post failure", err);
            res.status(500).end();
          });
      }
    }
  }
);

app.post(
  '/actions',
  bodyParser.urlencoded({extended: false}),
  ({body: {payload}}, res) => {
    /* eslint-disable-next-line */
    const {actions: [action], callback_id, response_url} = JSON.parse(payload);
    const match    = /askia_poll_([\d+])/.exec(callback_id);
    const pollId   = match !== null ? parseInt(match[1], 10) : undefined;
    const poll     = db.get(pollId);
    const actionId = parseInt(action.name, 10);
    const response = poll !== undefined
      ? poll.responses.find(x => x.name === actionId)
      : undefined;

    if (response !== undefined) {
      response.votes += 1;

      slackMessage(response_url, pollMsg(poll, true))
        .then(_ => res.status(200).end())
        .catch(err => {
          log("Action failure", err);
          res.status(500).end();
        });
    }
    else {
      res.status(404).end('Poll does not exist anymore');
    }
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
    {
      "fallback"       : "Cannot display the responses",
      "callback_id"    : `askia_poll_${x.id}`,
      "color"          : "#283B49",
      "attachment_type": "default",
      "actions"        : x.responses
    }
  ]
});

/**
 * Creates the poll text message.
 *
 * @type {Poll -> String}
 */
const pollTpl = x => [
  x.question,
  '',
  ...x.responses
    .slice()
    .sort(sorter)
    .map(y => `• ${y.text} \`${y.votes}\`\n`)
].join('\n');

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


/**
const connect = (f) => new Promise((resolve, reject) => {
    MongoClient.connect(url, (err, client) => {
      if (err) return reject(err);
      resolve({client, db: client.db(dbName)});
    }); 
});

const create = () => connect()
  .then(ctx => dosomething return ctx)
  .then(ctx => ctx.client.close())

 */
