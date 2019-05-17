import * as db      from "./db.js";
import {throwError} from "../util.js";

/**
 * Gets a team document by its unique identifier.
 *
 * @param {string} id
 * Unique identifier of the team to look for.
 *
 * @returns {Promise<Team>}
 * Returns the poll object.
 */
export const get = id => connect()
  .then(col => col.findOne({teamId: {$eq: id}}))
  .catch(throwError);

/**
 * Create a new poll document.
 *
 * @param {Team} poll
 * The team document to create in database.
 *
 * @returns {Promise<Team>}
 * Returns the created team document.
 */
export const create = team => connect()
  .then(col => col.insertOne(team))
  .then(({ops: [x]}) => x)
  .catch(throwError);

/**
 * Initializes the connection to the mongodb database.
 *
 * @returns {Promise<Collection>}
 * Returns the team collection reference from the database.
 */
export const connect = () => db.connect("teams");
