const {MongoClient, ObjectID} = require("mongodb");

/**
 * Initializes the connection to the mongodb database
 *
 * @returns {Promise<Collection>}
 * Returns the specified `collection` reference from the database.
 */
exports.connect = collection => new Promise((resolve, reject) =>
  MongoClient.connect(
    process.env.DATABASE_URL,
    {useUnifiedTopology: true, useNewUrlParser: true},
    (err, conn) => err
      ? reject(err)
      : Promise
        .resolve(conn.db(process.env.DATABASE_NAME).collection(collection))
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
exports.objectId = pollId => ({_id: new ObjectID(pollId)});
