const request    = require('request');
const express    = require('express');
const bodyParser = require('body-parser');
const app        = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port', (process.env.PORT || 9001));
app.get('/', (req, res) => res.send('It works!'));

app.post('/post', (req, res) => {
  res.status(200).end();

  const {body, response_url, token} = req;

  if (token !== process.env.SLACK_APP_TOKEN) {
    console.error('Invalid token');
    res.status(403).end('Access forbidden');
  }
  else {
    sendMessageToSlackResponseURL(response_url, {
      "text": "This is your first interactive message",
      "attachments": [
        {
          "text": "Building buttons is easy right?",
          "fallback": "Shame... buttons aren't supported in this land",
          "callback_id": "button_tutorial",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": "yes",
              "text": "yes",
              "type": "button",
              "value": "yes"
            },
            {
              "name": "no",
              "text": "no",
              "type": "button",
              "value": "no"
            },
            {
              "name": "maybe",
              "text": "maybe",
              "type": "button",
              "value": "maybe",
              "style": "danger"
            }
          ]
        }
      ]
    })
  }
});

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
      // handle errors as you see fit
    }
  })
}
