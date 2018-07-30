const polls = new Map();

/**
 * Minimalistic in-merory database for polls.
 */
exports.generate = (userId, values) => {
  const id   = ++seed;
  const data = [];
  const poll = add(data, {
    id,
    ownerId  : userId,
    question : values[0],
    responses: values
      .slice(1)
      .reduce((xs, x, i) => [...xs, response(i + 1, x)], [])
  });

  polls.set(id, poll);

  return poll;
};

exports.get = pollId => polls.get(pollId);

/**
 * Creates a response entry.
 *
 * @type {Int -> String -> SlackAttachmentType -> ResponseEntry}
 */
const response = (id, text, type = "button") => ({
  "type" : type,
  "name" : id,
  "value": id,
  "votes": 0,
  text
});

/**
 * Adds an element `x` to an array `xs`.
 *
 * @template a
 * @type {[a] -> a -> [a]}
 */
const add = (xs, x) => (xs.push(x), x);

/**
 * Specifies a unique identifier seed for polls.
 *
 * @type {Int}
 */
let seed = 0;
