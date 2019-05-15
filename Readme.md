# /Askia Slack polling app

/askia is a free Slack app created by [Askia](https://www.askia.com) to ask & answer simple polling questions in a Slack workspace. He can be yours right now, simply download him from [here](https://bot.askia.com).

/askia is open source (licensed under GNU GPL v3), and you can use him to help you decide anything: where you'll be eating for lunch, what time your friends or colleagues want to meet up, ...

## Slack

1. Go on https://api.slack.com/apps. Then create a new app in Slack.

2. Give it a name and associate it to a Slack `domain`

3. Select `Slash Commands` and click `Create New Command`

4. Set your slash command settings to `https://{yourdomain}/post`

5. Select `Interactive Components` and add a request `https://{yourdomain}/actions`

6. Select `OAuth & Permissions` and click `Install App to Workspace`

7. Get your workspace token

8. Scroll down to `Scopes` and sets your workspace rights

   - `chat:write:bot`
   - `chat:write:user`

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
   step `5` from the `Slack configuration` guide.

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

6. Set the server `PORT`

   ```
   export PORT=6463
   ```

7. Install and run certbot to generate the SSL certificate

   ```
   sudo apt install certbot
   ```

8. Once SSL cert is generated:

   * set `SSL_KEY` to your `privkey.pem` path
   * set `SSL_CERT` to your `cert.pem` path
   * set `SSL_CHAIN` to your `chain.pem` path

9. Install PM2 with npm

   ```
   npm install --global pm2
   ```

10. Register and launch your application with pm2


**NOTES:** Do not forget to launch PM2 and exports variables at startup.

- PM2 startup script: https://pm2.io/docs/en/runtime/guide/startup-hook
- Env variables can be defined in pm2 ecosystem file: https://pm2.io/doc/en/runtime/guide/ecosystem-file/

/askia is licensed by [Askia - automating insight](https://www.askia.com) under [GNU GPL v3](https://github.com/Askia/askia-slack-poll/blob/master/LICENSE).
