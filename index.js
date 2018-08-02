const request     = require('request');
const express     = require('express');
const bodyParser  = require('body-parser');
const {WebClient} = require('@slack/client');
const parser      = require('./src/parser');
const db          = require('./src/db');

const web = new WebClient(process.env.SLACK_APP_OAUTH);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port', (process.env.PORT || 9001));
app.get('/', (req, res) => res.send('It works!'));

app.post(
  '/post',
  /* eslint-disable-next-line */
  ({body:{token, user_id, text, response_url, channel_id}}, res) => {
    if (token !== process.env.SLACK_APP_TOKEN) {
      console.error('Invalid token', token);
      res.status(403).end('Access forbidden');
    }
    else {
      const values = parser.parse(text);

      if (3 > values.length) {
        res.status(400).end('Not enough values found');
      }
      else {
        const poll = db.generate(
          user_id,
          channel_id,
          values
        );

        web.chat.postMessage({
          /* eslint-disable-next-line */
          "channel"    : channel_id,
          "text"       : poll.question,
          "attachments": [
            {
              "fallback"       : "Cannot display the responses",
              "callback_id"    : `askia_poll_${poll.id}`,
              "color"          : "#3AA3E3",
              "attachment_type": "default",
              "actions"        : poll.responses
            }
          ]
        }).then(response => (poll.ts = response.ts, response))
          .then(_ => res.status(200).end())
          .catch(err => {
            console.error("actions::response::failure", err);
            res.status(500).end();
          });
      }
    }
  });

app.post(
  '/actions',
  bodyParser.urlencoded({extended: false}),
  ({body: {payload}}, res) => {
    const data   = JSON.parse(payload);
    const match  = /askia_poll_([\d+])/.exec(data.callback_id);

    if (match) {
      const pollId   = parseInt(match[1], 10);
      const poll     = db.get(pollId);
      const actionId = parseInt(data.actions[0].name, 10);
      const response = poll.responses.find(x => x.name === actionId);

      response.votes += 1;

      slackMessage(data.response_url, {
        "replace_original": true,
        "text"            : `You vote for ${response.text}`
      }).then(() => {
        res.status(200).end();

        return web.chat.update({
          "channel"    : poll.channelId,
          "ts"         : poll.ts,
          "text"       : poll.question,
          "attachments": [
            {
              "fallback" : "Cannot display poll result",
              "title"    : "Poll result",
              "image_url": [
                process.env.SLACK_APP_SERVER,
                `chart`,
                poll.time,
                response.votes,
                pollId,
                `poll.png`
              ].join('/')
            }
          ]
        });
      }).catch(err => {
        console.error("actions::response::failure", err);
        res.status(500).end();
      });
    }
  }
);

app.listen(
  app.get('port'),
  () => console.log('listent::port', app.get('port'))
);

const postOptions = {
  method : 'POST',
  headers: {
    'Content-type': 'application/json; charset=utf-8'
  }
};

const slackMessage = (uri, json) =>
  new Promise((resolve, reject) => request(
    {...postOptions, uri, json},
    (error, response, body) => error
      ? reject(error)
      : resolve({response, body})
  ));
