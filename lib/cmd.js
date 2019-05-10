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
        resolve([
          argv, options,
          [
            "To create a simple poll you can specify question and responses",
            "like this:\n",
            "```\n",
            "/askia Drink? Beer Water",
            "\n```",
            "If the question or the responses contains space they must be",
            "wrapped between quotes `\"` characters like this:\n",
            "```\n",
            '/askia "What ya wanna drink?" Wine',
            '"IPA Beer" "Stout Beer" "Water... Sorry"`',
            "\n```",
            "If a response is too long to be displayed as button or if",
            "you simply don't want repeat the whole text of your response",
            "in a button. You can select the part of your text that will",
            "be displayed as button text by using `@label{}.` in the",
            "response text",
            "```\n",
            '/askia "What ya wanna drink?"',
            '"@label{IPA} Beer"',
            '"Milk @label{Stout}"`',
            "```\n",
            "\n"
          ].join(" ")
        ]);
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
    "describe": [
      "Sets a limit of responses that a user can votes for.",
      "When set to `0` no limit is applied. Default value is",
      "set to `0`."
    ].join(' ')
  },
  "expires": {
    "default": "",
    "type": "string",
    "describe": [
      "```\n",
      '/askia Drink? Beer Water --expires "1d 2h"',
      "\n```\n",
      "Sets the times before users votes will expires.",
      "The times can be expressed like this:\n",
      [
        "",
        "• for 1 day `1d`",
        "• for 2 hours `2h`",
        "• for 10 min `10min`",
        "• for 30 seconds `30s`",
        ""
      ].join("\n"),
      "\nYou can combine all times like this:\n",
      [
        "",
        "• Without quotes `1d2h10min30s`",
        '• With quotes `"1d 2h 10min 2s"`',
        ""
      ].join("\n")
    ].join(" ")
  },
  "anonymous": {
    "default": false,
    "type": 'boolean',
    "describe": [
      "```\n",
      '/askia Drink? Beer Water --anonymous',
      "\n```\n",
      "The name of users will not be displayed while they vote"
    ].join(" ")
  },
  "no-anonymous-label": {
    "default": false,
    "type": "boolean",
    "describe": [
      "```\n",
      '/askia Drink? Beer Water --anonymous',
      "\n```\n",
      "When the `anonymous` flag is set, hides the `anonymous poll`",
      "quote at the end of the poll message"
    ].join(" ")
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
