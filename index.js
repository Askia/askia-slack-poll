const request    = require('request');
const express    = require('express');
const bodyParser = require('body-parser');
const app        = express();
const parser     = require('./src/text-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port', (process.env.PORT || 9001));
app.get('/', (req, res) => res.send('It works!'));

app.post('/post', ({body: {token, text, response_url}}, res) => {
  res.status(200).end();

  if (token !== process.env.SLACK_APP_TOKEN) {
    console.error('Invalid token', token);
    res.status(403).end('Access forbidden');
  }
  else {
    const values = parser(text);

    if (3 > values.length) {
      res.status(400).end('Not enough values found');
    }
    else {
      const poll = polls.generate(values);

      sendMessageToSlackResponseURL(response_url, {
        "text": "This is your first interactive message",
        "attachments": [
          {
            "text": poll.question,
            "fallback": "Shame on you...",
            "callback_id": `askia_poll_${poll.id}`,
            "color": "#3AA3E3",
            "attachment_type": "default",
            "actions": poll.responses
          }
        ]
      });
    }
  }
});

app.post(
  '/actions',
  bodyParser.urlencoded({extended: false}),
  ({body: {payload, response_url}}, res) => {
    res.status(200).end();

    const data = JSON.parse(payload);

    sendMessageToSlackResponseURL(data.response_url, {
      "text": data.user.name+" clicked: "+data.actions[0].name,
      "replace_original": true
    });
  }
)

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'))
});

const postOptions = {
  method: 'POST',
  headers: {'Content-type': 'application/json'},
};

const sendMessageToSlackResponseURL = (uri, json) => {
  request({...postOptions, uri, json}, (error, response, body) => {
    if (error){

    }
  })
}

const polls = {
  generate: (values) => ({
    id: seed++,
    question: values[0],
    responses: values
      .slice(1)
      .reduce((xs, x, i) => [...xs, item(i + 1, text)], [])
  })
};

const item = (id, text, type = "button") => ({
  "type": "button",
  "name": id,
  "value": id,
  text
});

let seed = 0;
