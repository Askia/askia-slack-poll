import {MongoClient, ObjectID} from "mongodb";
import {throwError}            from "./util.js";

/**
 * Gets a poll document by its unique identifier.
 *
 * @param {string} id
 * Unique identifier of the poll to look for.
 *
 * @returns {Promise<Poll>}
 * Returns the poll object.
 */
export const get = id => connect()
  .then(db => db.findOne(objectId(id)))
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
export const create = poll => connect()
  .then(db => db.insertOne(poll))
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
export const update = (id, data) => connect()
  .then(db => db.updateOne(objectId(id), {$set: data}))
  .then(_ => get(id))
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
export const remove = id => connect()
  .then(db => db.deleteOne(objectId(id)))
  .then(_ => id)
  .catch(throwError);

/**
 * Initializes the connection to the mongodb database
 *
 * @returns {Promise<Collection>}
 * Returns the polls collection reference from the database.
 */
export const connect = () => new Promise((resolve, reject) =>
  MongoClient.connect(process.env.DATABASE_URL, (err, conn) => err
    ? reject(err)
    : Promise
      .resolve(conn.db(process.env.DATABASE_NAME).collection('polls'))
      .then(resolve)
      .then(() => conn.close())
  ));

/**
 * Converts a poll unique identifier to a valid mongodb ObjectID.
 *
 * @param {string} pollId
 * The unique identifier to convert.
 *
 * @returns {ObjectID}
 * Returns the converted ObjectID.
 */
const objectId = pollId => ({_id: new ObjectID(pollId)});
