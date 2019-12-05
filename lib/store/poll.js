const db           = require("./db.js");
const {throwError} = require("../util.js");

/**
 * Gets a poll document by its unique identifier.
 *
 * @param {string} id
 * Unique identifier of the poll to look for.
 *
 * @returns {Promise<Poll>}
 * Returns the poll object.
 */
exports.get = id => connect()
  .then(col => col.findOne(db.objectId(id)))
  .catch(throwError);

/**
 * Create a new poll document.
 *
 * @param {Poll} poll
 * The poll document to create in database.
 *
 * @returns {Promise<Poll>}
 * Returns the created poll document.
 */
exports.create = poll => connect()
  .then(col => col.insertOne(poll))
  .then(({ops: [x]}) => x)
  .catch(throwError);

/**
 * Update a poll document by its unique identifier.
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
  .then(col => col.updateOne(db.objectId(id), {$set: data}))
  .then(_ => exports.get(id))
  .catch(throwError);


/**
 * Deletes a poll document by its unique identifier.
 *
 * @param {string} id
 * Unique identifier of the poll to delete.
 *
 * @returns {Promise<string>}
 * Returns the unique identifier of the deleted poll.
 */
exports.remove = id => connect()
  .then(col => col.deleteOne(db.objectId(id)))
  .then(_ => id)
  .catch(throwError);

/**
 * Initializes the connection to the mongodb database
 *
 * @returns {Promise<Collection>}
 * Returns the polls collection reference from the database.
 */
const connect = () => db.connect("polls");
