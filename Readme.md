# Slack

1. Go on https://api.slack.com/apps. Then create a new app in Slack.

2. Give it a name and associate it to a Slack `domain`

3. Select `Slash Commands` and click `Create New Command`

4. Set your slash command settings

5. Select `OAuth & Permissions` and click `Install App to Workspace`

6. Get your workspace token

7. Scroll down to `Scopes` and sets your workspace rights

   - `chat:write:bot`
   - `chat:write:user`

# Server

1. Install
   Create a `unix` server:

   - `yarn: 1.7.0`
   - `node: 10.7.0`
   - `npm: 6.2.0`

2. Clone the repository on your server.

3. Set `SLACK_APP_OAUTH` environment variable with token that you got at
   step `5` from the `Slack configuration` guide.

   ```
   export SLACK_APP_OAUTH=xoxp-xxx-xxx-xxx-xxx
   ```

4. Set `SLACK_APP_TOKEN` environment variable with token that you can get
   on Slack appliction interface. Go to `Basic Information` then scroll
   down to `App Credentials` and gets the `Verification Token` value.

  ```
  export SLACK_APP_TOKEN=xxxxxxxxxx
  ```

5. Set `SLACK_APP_SERVER` with the public DNS of your server.

  ```
  export SLACK_APP_SERVER=http://myappserver.com
  ```

6. Go at the root level of your repository start the server

   ```
   yarn start
   ```
