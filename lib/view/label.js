/**
 * Unescape the `@label{}` calls. For example: `I want a @label{beer}`
 * will become `I want a beer`.
 *
 * @param {string} cs
 * The string to escape.
 *
 * @returns {string}
 * Returns the escaped string.
 */
export const unescape = cs => {
  let st = cs;
  let rs;
  while ((rs = labelReg.exec(st))) st = rs.input.replace(rs[0], rs[1]);
  return st;
};

/**
 * Extracts all `@label{}` values. For example `I want to go @label{home}
 * and drink a @label{beer}` will returns ["home", "beer"].
 *
 * @param {string} cs
 * The string where to look for label values.
 *
 * @param {string[]}
 * Returns the list of values.
 */
export const extract = cs => {
  let st = cs;
  let rs;
  const xs = [];
  while ((rs = labelReg.exec(st))) {
    st = rs.input.substr(rs.index + rs[0].length);
    xs.push(rs[1]);
  }

  return xs;
};

/**
 * The `@label{}` regular expression.
 *
 * @type {RegExp}
 */
const labelReg = /\@label\{([^}]+)\}/;
