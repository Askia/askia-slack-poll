/* eslint-disable max-len */
exports.dispatch = (err, info) => {
  if ("slack_webapi_platform_error" === err.code) {
    switch (err.data.error) {
      case 'not_authed':
        return info.channel.startsWith('D')
          ? authD(info)
          : auth(info);
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
const auth = info => tpl(
  info,
  "Slack authentication error",
  [
    "There was an unexpected authentication error.",
    "Please click link above to install or refresh your credentials :pray:"
  ].join(" "),
  process.env.SLACK_APP_LINK,
);

/** Returns message related to slack authentication errors */
const authD = info => tpl(
  info,
  "Slack authentication error",
  [
    "It seems that you tried to use the application with direct messaging.",
    "Even if the application is installed in your workspace it does not mean that",
    "it is available for private usage as direct messaging. The application must",
    "be installed on your account",
    "\n",
    "Please click link above to install the app or refresh your credentials :pray:"
  ].join(" "),
  process.env.SLACK_APP_LINK
);

/** Returns message related to message which has expired from slack server */
const expiredMessage = info => tpl(
  info,
  "Slack message has expired",
  "This message cannot be updated anymore"
);

/** Returns default message for all unhandled slack errors */
const slack = (err, info) => tpl(info, "Slack error", err.message, );

/** Returns message for all unhandled errors */
const unhandled = (err, info) => tpl(info, "Poll error", err.message);

/** Base template for all error message */
const tpl = (info, title, text, titleLink) => ({
  ...info,
  "attachments": [
    {
      "fallback": [
        title,
        ...(titleLink ? [titleLink] : []),
        text
      ].join(" - "),
      title,
      text,
      ...(titleLink ? {"title_link": titleLink} : {}),
      "color": errColor
    }
  ]
});

const errColor = "#D42F2F";
