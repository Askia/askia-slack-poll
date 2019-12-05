const timestring   = require("timestring");
const {throwError} = require("../util.js");

/**
 * Create a new poll object from a slack `userId` and `channelId` and
 * from the command line arguments.
 *
 * @param {number} userId
 * The slack user unique identifier.
 *
 * @param {number} channelId
 * The slack channel unique identifier.
 *
 * @param {PollCmd} data
 * The command line arguments object.
 */
exports.from = (userId, channelId, data)  => ({
  "ownerId": userId,
  "channelId": channelId,
  "time": new Date().getTime(),
  "anonymous": data.anonymous,
  "noAnonymousLabel": data.noAnonymousLabel,
  "messageTs": '',
  "limit": data.limit,
  ...formatExpires(data.expires),
  ...formatQuestionResponses(data._)
});

/**
 * Creates a poll response entry.
 *
 * @returns {PollResponse}
 * Returns the created response object.
 */
const response = (id, text) => ({
  "value": id,
  "votes": 0,
  "users": [],
  text
});

/**
 * Gets the `expires` field value from the command line arguments.
 *
 * @param {string} expires
 * The time duration.o
 *
 * @returns {number}
 * Returns the times in seconds.
 */
const formatExpires = expires => {
  if (expires) {
    try {
      return {"expires": timestring(expires)};
    }
    catch {
      throw new Error("Invalid `expires` argument formatting");
    }
  }
  else {
    return {"expires": 0};
  }
};

/**
 * Gets the `question` and `responses` field from positional
 * arguments list of command line arguments.
 *
 * @param {string[]} list
 * The positional argument list.
 *
 * @returns {{question: string, responses: PollResponse[]}}
 * Returns the formatted object.
 */
const formatQuestionResponses = list => {
  return 3 > list.length
    ? throwError(new Error("Not enough values to create the poll"))
    : {
      "question": list[0],
      "responses": list
        .slice(1)
        .reduce((xs, x, i) => [...xs, response(i + 1, x)], [])
    };
};

/**
 * @typedef {Object} Poll
 * The poll data object model.
 *
 * @property {number} userId
 * The slack user unique identifier which runs the command.
 *
 * @property {number} channelId
 * The slack channel unique identifier from which the command where sent.
 *
 * @property {string} question
 * The question text.
 *
 * @property {PollResponse[]} responses
 * The list of responses.
 *
 * @property {number} expires
 * The poll expiring times express in milliseconds.
 *
 * @property {boolean} anonymous
 * When set to `true` user names will not be placed under the response(s)
 * they votes for.
 *
 * @property {boolean} noAnonymousLabel
 * When anonymous is set, disables the anonymous label put at the end
 * of the poll message.
 *
 * @property {number} limit
 * Specifies the number of responses that a user can vote for. `0` value
 * is translated as unlimited
 */
