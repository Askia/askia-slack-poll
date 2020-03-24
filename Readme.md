# /Askia Slack polling app

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

/askia is a free Slack app created by [Askia](https://www.askia.com) to ask & answer simple polling questions in a Slack workspace. He can be yours right now, simply download him from [here](https://bot.askia.com).

/askia is open source (licensed under GNU GPL v3), and you can use him to help you decide anything: where you'll be eating for lunch, what time your friends or colleagues want to meet up, ...

## Slack

1. Go on https://api.slack.com/apps. Then create a new app in Slack.

2. Give it a name and associate it to a Slack `domain`

3. Select `Slash Commands` and click `Create New Command`

4. Set your slash command settings to `https://{yourdomain}/post`

5. Select `Interactive Components` and add a request `https://{yourdomain}/actions`

6. Select `OAuth & Permissions` and click `Install App to Workspace`

7. Add redirect url : `https://{yourserveraddress}/slack/auth/redirect`

7. Get your workspace token

8. Scroll down to `Scopes` and sets your workspace rights

   - `chat:write:bot`
   - `chat:write:user`

## Database

1. Install mongodb

2. Set your database url in env var. 
   
   ```
   export DATABASE_URL="mongodb://127.0.0.1:27017"
   ```

3. Set your database name in mongodb and then in env vars too.

   ```
   export DATABASE_NAME="myPollDb"
   ```

## Server

1. Create a Unix server and install:

   - `node: 10.x.x`
   - `npm: 6.x.x`

2. Clone the repository on your server.

3. Go at the root level of your repository and then install
   package dependencies

   ```
   npm install
   ```

4. Set `SLACK_APP_OAUTH` environment variable with token that you got at
   step `6` from the `Slack configuration` guide.

   ```
   export SLACK_APP_OAUTH=xoxp-xxx-xxx-xxx-xxx
   ```

5. Set `SLACK_APP_TOKEN` environment variable with token that you can get
   on your Slack application management interface. Go to `Basic Information`
   then scroll down to `App Credentials` and gets the `Verification Token`
   value.

   ```
   export SLACK_APP_TOKEN=xxxxxxxxxx
   ```

6. If your app is not distributed you'll have to disable the team authentication

   ```
   export DISABLE_SLACK_TEAM_AUTH=1
   ```

   Otherwise:

   ```
   export DISABLE_SLACK_TEAM_AUTH=""
   ```

7. Set the server `PORT`

   ```
   export PORT=6463
   ```

8. Install and run certbot to generate the SSL certificate

   ```
   sudo apt install certbot
   ```

9. Once SSL cert is generated:

   * set `SSL_KEY` to your `privkey.pem` path
   * set `SSL_CERT` to your `cert.pem` path
   * set `SSL_CHAIN` to your `chain.pem` path

10. Install PM2 with npm

   ```
   npm install --global pm2
   ```

11. Register and launch your application with pm2

12. Go back to the slack app interface and go to `Manage distribution` and click to the slack button and proceed to the installation

**NOTES:** Do not forget to launch PM2 and exports variables at startup.

- PM2 startup script: https://pm2.io/docs/en/runtime/guide/startup-hook
- Env variables can be defined in pm2 ecosystem file: https://pm2.io/doc/en/runtime/guide/ecosystem-file/

## Usage

To create a simple poll you can specify question and responses like this:
`/askia Drink? Wine Beer Pastis Water`

If the question or the responses contains space they must be wrapped between quotes \" characters like this:

`/askia "What ya wanna drink?" "IPA Beer" "Stout Beer" Other`

If a response is too long to be displayed as button or if you simply don't want to repeat the whole text of your response in a button. You can select the part of your text that will be displayed as button by using @label{}. in the response text:

`/askia "What ya wanna drink?" "Double @label{IPA}" "Milk @label{Imperial Stout}"`

--limit

`/askia "What ya wanna drink?" Wine Beer Scotch Pastis Water --limit 1`
Sets a limit of responses that a user can votes for. When set to 0 no limit is applied. Default value is set to 0.

--expires

`/askia "What ya wanna drink on Friday?" Wine Beer Water --expires "1d 2h"`
Sets the times before users votes will expires. The times can be expressed like this:
- for 1 day 1d
- for 2 hours 2h
- for 10 min 10min
- for 30 seconds 30s

--anonymous

`/askia Drink? Wine Beer Water --anonymous`
The name of users will not be displayed while they vote--no-anonymous-label/askia Drink? Beer Water --anonymous --no-anonymous-labelWhen the anonymous flag is set, hides the anonymous poll quote at the end of the poll message. 

/askia is licensed by [Askia - automating insight](https://www.askia.com) under [GNU GPL v3](https://github.com/Askia/askia-slack-poll/blob/master/LICENSE).
