/* eslint-disable max-len */
exports.dispatch = (err, info) => {
  if ("slack_webapi_platform_error" === err.code) {
    switch (err.data.error) {
      case 'not_authed':
        return auth(info);
      case 'cant_update_message':
        return expiredMessage(info);
      default:
        return slack(err, info);
    }
  }
  else {
    return unhandled(err, info);
  }
};


/** Returns message related to slack authentication errors */
const auth = info => ({
  ...info,
  "attachments": [
    {
      "fallback": [
        "Slack authentication error",
        "There was an unexpected authentication error. Please click the link to install or refresh your credentials",
        process.env.SLACK_APP_LINK
      ].join("\n"),
      "title": "Slack authentication error",
      "title_link": process.env.SLACK_APP_LINK,
      "text": "There was an unexpected authentication error. Please click link above to install or refresh your credentials :pray:",
      "color": errColor
    }
  ]
});

/** Returns message related to message which has expired from slack server */
const expiredMessage = info => ({
  ...info,
  "attachments": [
    {
      "fallback": [
        "Slack message has expired",
        "This message cannot be updated anymore"
      ].join("\n"),
      "title": "Slack message has expired",
      "text": "This message cannot be updated anymore",
      "color": errColor
    }
  ]
});


/** Returns default message for all unhandled slack errors */
const slack = (err, info) => ({
  ...info,
  "attachments": [
    {
      "fallback": err.message,
      "title": "Slack error",
      "text": err.message,
      "color": errColor
    }
  ]
});

/** Returns message for all unhandled errors */
const unhandled = (err, info) => ({
  ...info,
  "attachments": [
    {
      "fallback": err.message,
      "title": "Poll error",
      "text": err.message,
      "color": errColor
    }
  ]
});

const errColor = "#D42F2F";
