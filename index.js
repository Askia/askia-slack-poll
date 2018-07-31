const request    = require('request');
const express    = require('express');
const bodyParser = require('body-parser');
const parser     = require('./src/parser');
const db         = require('./src/db');
const canvas     = require('./src/chart');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port', (process.env.PORT || 9001));
app.get('/', (req, res) => res.send('It works!'));
app.get('/chart/:time/:votes/:poll_id/poll.png', (req, res) => {
  const id   = parseInt(req.params.poll_id, 10);
  const poll = Number.isNaN() ? null : db.get(id);

  if (poll !== null) {
    canvas.generate(poll.responses)
      .then(buffer => {
        res.status(200);
        res.contentType('image/png');
        res.end(buffer, 'binary');
      })
      .catch(err => {
        console.error("chart::generate::failure", err);
        res.status(500).end();
      });
  }
  else {
    res.status(404).end();
  }
});

/* eslint-disable-next-line */
app.post(
  '/post',
  ({body: {token, user_id, text, response_url}}, res) => {
    res.status(200).end();

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
        const poll = db.generate(user_id, values);

        slackMessage(response_url, {
          "text"         : `*${poll.question}*`,
          "response_type": "in_channel",
          "attachments"  : [
            {
              "fallback"   : "Cannot display the question",
              "callback_id": `askia_poll_question_${poll.id}`,
              "color"      : "#3AA3E3"
            }
          ]
        });
        slackMessage(response_url, {
          "response_type": "ephemeral",
          "attachments"  : [
            {
              "fallback"       : "Cannot display the responses",
              "callback_id"    : `askia_poll_responses_${poll.id}`,
              "color"          : "#3AA3E3",
              "attachment_type": "default",
              "actions"        : poll.responses
            }
          ]
        });
      }
    }
  });

app.post(
  '/actions',
  bodyParser.urlencoded({extended: false}),
  ({body: {payload}}, res) => {
    res.status(200).end();

    const data   = JSON.parse(payload);
    const match  = /askia_poll_responses_$([\d+])/.exec(data.callback_id);

    if (match) {
      const pollId   = parseInt(match[1], 10);
      const poll     = db.get(pollId);
      const actionId = parseInt(data.actions[0].name, 10);
      const response = poll.responses.find(x => x.name === actionId);

      response.votes += 1;

      console.log(payload);
      /*
      slackMessage(data.response_url, {
        "replace_original": true,
        "attachments"     : [
          {
            "fallback" : "Cannot display poll result",
            "title"    : "Poll result",
            "image_url": [
              `https://mighty-bayou-64992.herokuapp.com`,
              `chart`,
              poll.time,
              response.votes,
              pollId,
              `poll.png`
            ].join('/')
          }
        ]
      }).catch(err => {
        console.error("post::response::failure", err);
        res.status(500).end();
      });
      */
    }
  }
);

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});

const postOptions = {
  method : 'POST',
  headers: {'Content-type': 'application/json'}
};

const slackMessage = (uri, json) =>
  new Promise((resolve, reject) => request(
    {...postOptions, uri, json},
    (error, response, body) => error
      ? reject(error)
      : resolve({response, body})
  ));
