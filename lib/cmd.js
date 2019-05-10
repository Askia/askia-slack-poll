import * as yargs from "yargs";

/**
 * Gets the poll command line arguments from the specified `cs` string.
 *
 * @param {string} cs
 * The string to parse.
 *
 * @returns {Promise<[PollCmd, string]>}
 * Returns the command line arguments formatted as object.
 */
export const parse = cs => new Promise((resolve, reject) => {
  yargs
    .option(options)
    .parse(cs.replace(/“|”/g, '"'), (err, argv) => {
      if (err) {
        reject(new Error("Cannot interpret the command"));
      }
      else {
        resolve(argv);
      }
    });
});

/**
 * Available options for the command line.
 */
const options = Object.freeze({
  "limit": {
    "default": 0,
    "type": 'number',
    "describe": "Sets a limit of responses that a user can votes for."
  },
  "expires": {
    "default": "",
    "type": "string",
    "describe": "Sets the times before users votes will expires."
  },
  "anonymous": {
    "default": false,
    "type": 'boolean',
    "describe": "The name of users will not be displayed while they vote"
  },
  "no-anonymous-label": {
    "default": false,
    "type": "boolean",
    "describe": "When the `anonymous`, hides the `anonymous poll` quote"
  }
});

/**
 * @typedef {Object} PollCmd
 * The poll command line arguments.
 *
 * @property {string[]} _
 * Arbitrary arguments passed to the command in there positional order where
 * the first element defines the question text and the others the text of
 * responses. The array must contains at least three items to be considered
 * as valid.
 *
 * @property {string} [expires=""]
 * The poll expiring times express as timestring.
 *
 * @property {boolean} [anonymous=false]
 * When set to `true` user names will not be placed under the response(s)
 * they votes for.
 *
 * @property {boolean} [noAnonymousLabel=false]
 * When anonymous is set, disables the anonymous label put at the end
 * of the poll message.
 *
 * @property {number} [limit=0]
 * Specifies the number of responses that a user can vote for. `0` value
 * is translated as unlimited
 */
