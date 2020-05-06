const db                = require("./db.js");
const {throwError, tap} = require("../util.js");

/**
 * Gets a team document by its unique identifier.
 *
 * @param {string} id
 * Unique identifier of the team to look for.
 *
 * @returns {Promise<Team>}
 * Returns the poll object.
 */
exports.get = id => connect()
  .then(([client, col]) => col
    .findOne({teamId: {$eq: id}})
    .then(tap(_ => client.close()))
  )
  .catch(throwError);

/**
 * Create a new team document if not already registered
 * otherwise update it.
 *
 * @param {Team} team
 * The team document to create in database.
 *
 * @returns {Promise<Team>}
 * Returns the created team document.
 */
exports.create = team => exports
  .get(team.teamId)
  .then(t => t === null
    ? insert(team)
    : exports.update(team.teamId, {"token": team.token}))
  .catch(throwError);

/**
 * Update a team document by its unique identifier.
 *
 * @param {string} id
 * Unique identifier of the poll to look for update.
 *
 * @param {Object} data
 * The data modification to set to the poll document.
 *
 * @returns {Promise<Poll>}
 * Returns the updated poll document.
 */
exports.update = (id, data) => connect()
  .then(([client, col]) => col
    .updateOne({teamId: {$eq: id}}, {$set: data})
    .then(tap(_ => client.close()))
  )
  .then(_ => exports.get(id))
  .catch(throwError);

/**
 * Insert a new team entry in database.
 */
const insert = team => connect()
  .then(([client, col]) => col
    .insertOne(team)
    .then(({ops: [x]}) => x)
    .then(tap(_ => client.close()))
  )
  .catch(throwError);

/**
 * Initializes the connection to the mongodb database.
 *
 * @returns {Promise<Collection>}
 * Returns the team collection reference from the database.
 */
const connect = () => db.connect("teams");
