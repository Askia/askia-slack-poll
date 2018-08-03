exports.parse = cs => fold(cs, sum, []);

/**
 * Folds a text `cs` to an array of strings matching
 * the `textReg` expression.
 */
const fold = (cs, f, initial) => {
  let sum = initial;
  let ret;

  while ((ret = textReg.exec(cs))) sum = f(sum, ret);
  return sum;
};

/**
 * Accumulates parsed data `x` to `xs`.
 *
 * @type {[Strint] -> [String]}
 */
const sum = (xs, x) => [...xs, isQuoted(x) ? quoted(x) : unquoted(x)];

/**
 * Checks that parsed data has two consecutive double quotes.
 *
 * @type {[String] -> Boolean}
 */
const isQuoted = xs => typeof xs[2] === 'string';

/**
 * Extracts a quoted value from a parsed data and replaced escaped
 * double quotes expressions `""` by valide string escape.
 *
 * @param {[String]} xs
 * The parsed data.
 *
 * @returns {String}
 * Returns the unquoted value.
 */
const quoted = xs => xs[2].replace(quoteReg, "\"");

/**
 * Extracts a unquoted value from a parsed data
 *
 * @param {[String]} xs
 * The parsed data.
 *
 * @returns {String}
 * Returns the unquoted value.
 */
const unquoted = xs => xs[3];

/**
 * Specifies a regular expression to parse `askia-poll` commands.
 *
 * @type {RegExp}
 */
const textReg = new RegExp(
  (
    // delimiters.
    `(\\s|\\r?\\n|\\r|^)+` +
    // quoted fields.
    `(?:["“]([^"”]*(?:""[^"]*)*)["”]|` +
    // unquoted fields.
    `([^"\\s\\r\\n]*))`
  ),
  "gi"
);

/**
 * Specifies a regular expression for double double-quotes check.
 *
 * @type {RegExp}
 */
const quoteReg = /""/g;
