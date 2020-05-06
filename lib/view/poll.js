const label                      = require("./label.js");
const {callbackId, last, sorter} = require("../util.js");

/**
 * Creates the slack poll request obje.
 *
 * @type {SlackMessage}
 */
exports.create = poll => ({
  ...(poll.messageTs ? {"ts": poll.messageTs} : {}),
  "channel": poll.channelId,
  "text": renderText(poll),
  "attachments": [
    ...poll.responses.reduce(
      (xs, response, i) => 0 === i % 5
        ? [...xs, attachment(poll, response)]
        : [...xs.slice(0, -1), addButton(last(xs), response)],
      []
    ),
    {
      "fallback": "Cannot display the remove button",
      "callback_id": callbackId(poll._id),
      "color": "#283B49",
      "attachment_type": "default",
      "actions": [
        {
          "type": "button",
          "name": "delete",
          "value": "delete",
          "style": "danger",
          "text": "Delete poll"
        }
      ]
    }
  ]
});

/**
 * Creates a {@link SlackAttachment} object for a given {@link Poll} object
 * with the specified response bounded as attachement action.
 *
 * @param {Poll} poll
 * The poll for which the attachement is create.
 *
 * @param {PollResponse} response
 * The response to bind as an attachement action.
 *
 * @returns {SlackAttachment}
 * Returns the created slack attachment oject.
 */
const attachment = (poll, response) => ({
  "fallback": "Cannot display the responses",
  "callback_id": callbackId(poll._id),
  "color": "#283B49",
  "attachment_type": "default",
  "actions": [button(response)]
});

/**
 * Binds an action `x` to a SlackAttachement object `o`.
 *
 * @param {SlackAttachement} attachment
 * The attachment where you want to add the action
 *
 * @param {PollResponse} response
 * The poll response object to add as an attachment action.
 *
 * @returns {SlackAttachment}
 * Returns the modified attachment object.
 */
const addButton = (attachment, response) => ({
  ...attachment,
  "actions": [
    ...attachment.actions,
    button(response)
  ]
});

/**
 * Creates a slack button from a response object.
 */
const button = response => {
  const labels = label.extract(response.text);
  return {
    "type": "button",
    "name": "response",
    "value": response.value,
    "text": labels.length
      ? labels.join(' ')
      : response.text
  };
};

/**
 * Renders the responses of the poll text message.
 *
 * @param {Poll} poll
 * The poll object to render.
 */
const renderText = poll => [
  '*'.concat(poll.question).concat('*'),
  '',
  ...poll.responses
    .slice()
    .sort(sorter)
    .map(response => renderResponse(poll, response)),
  ...renderAnonymousLabel(poll)
].join('\n');

/**
 * Renders a {@link PollResponse} object.
 *
 * @param {Poll} poll
 * The poll context to wich the response belongs.
 *
 * @param {PollResponse}
 * The poll response object to render
 *
 * @returns {string}
 * Returns the rendered response.
 */
const renderResponse = (poll, response) => [
  `• *${label.unescape(response.text)}* \`${response.votes}\``,
  `${renderUsers(poll, response.users)}`
].join('\n');

/**
 * Renders the list of `users` depending of the `poll` context.
 *
 * @param {string[]} response
 * The list of users to render.
 *
 * @param {Poll} poll
 * The poll context to the which the response belongs to.
 *
 * @returns {string}
 * Returns the rendered list of users.
 */
const renderUsers = (poll, users) => !poll.anonymous
  ? users.map(user => `_${user}_`).join(', ')
  : '';

/**
 * Renders the `anonymous poll` as quote only if `anonymous` flag is set
 * and `noAnonymousLabel` flag is not set depending of the poll settings.
 *
 * @param {Poll} poll
 * The poll object.
 *
 * @returns {string[]}
 * Returns a list of strings.
 */
const renderAnonymousLabel = poll =>
  poll.anonymous && !poll.noAnonymousLabel
    ? ["> anonymous poll"]
    : [];
