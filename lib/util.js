/**
 * Get the slack callback unique identifier from an int value.
 *
 * @param {number} i
 * The int value from which to get the callback id.
 *
 * @returns {string}
 * Returns the slack callback unique identifier.
 */
exports.callbackId = i => `${CALLBACK_ID_PREFIX}${i}`;

/**
 * Extracts a poll unique identifier from a slack `callback_id` value.
 *
 * @param {string} callbackId
 * The slack `callback_id` value.
 *
 * @returns {string}
 * Returns the poll id value.
 */
exports.pollIdFrom = callbackId =>
  new Promise((resolve, reject) => {
    const match = CALLBACK_ID_REGEXP.exec(callbackId);
    match !== null
      ? resolve(match[1])
      : reject(new Error("Undefined poll. It has probably expired"));
  });

/**
 * Gets the response object of a poll from a Slack action object.
 *
 * @param {SlackAction} action
 * The slack action object.
 *
 * @param {Poll} poll
 * The poll object where to look for the response object.
 *
 * @returns {PollResponse}
 * Returns the poll response object or throw an error.
 */
exports.responseFromAction = (action, poll) =>
  new Promise((resolve, reject) => {
    const actionId = parseInt(action.value, 10);
    const response = poll.responses.find(x => x.value === actionId);
    response !== undefined
      ? resolve(response)
      : reject(new Error("Undefined poll response"));
  });

/**
 * Gets an ordering value for a specified {@link PollResponse} `x`
 * compared to another existing {@link PollResponse} `y`.
 *
 * @param {PollResponse} x
 * The poll response to for which we get the ordering value.
 *
 * @param {PollResponse} y
 * The poll response which used as ordering comparison.
 *
 * @returns {number}
 * Returns an ordering int value between `-1` and `+1`.
 */
exports.sorter = (x, y) => {
  if (x.votes > y.votes) return exports.GT;
  if (x.votes < y.votes) return exports.LT;
  return exports.EQ;
};

exports.log = (...args) => x => console.log(...args, x);
exports.tap = f => x => (f(x), x);

/**
 * Gets the last element of an array.
 *
 * @param {a[]}
 * The array of elements.
 *
 * @returns {a}
 * Returns the last element of the array or `undefined`.
 */
exports.last = xs => xs[xs.length - 1];

/**
 * Throws an error of the specified constructor `E`.
 *
 * @param {Error} err
 * The error object to throw.
 */
exports.throwError = err => {
  throw err;
};

/**
 * Prefix for all slack callback unique identifiers.
 *
 * @type {string}
 */
const CALLBACK_ID_PREFIX = "askia_poll_";

/**
 * Regular expresion to extracts the poll unique identifier from a slack
 * `callback_id` value.
 *
 * @type {RegExp}
 */
const CALLBACK_ID_REGEXP = new RegExp(`${CALLBACK_ID_PREFIX}([a-z0-9]+)`);

/**
 * Represent the `greater` ordering value.
 *
 * @type {number}
 */
exports.GT = -1;

/**
 * Represent the `greater` ordering value.
 *
 * @type {number}
 */
exports.LT = +1;

/**
 * Represent the `greater` ordering value.
 *
 * @type {number}
 */
exports.EQ = 0;
