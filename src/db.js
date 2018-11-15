const {MongoClient, ObjectID} = require('mongodb');

/**
 * Initialize the connection to the mongodb database
 *
 * @function {() -> Promise<Collection>}
 */
const connect = () => new Promise((resolve, reject) =>
  MongoClient.connect(process.env.DATABASE_URL, (err, conn) => err
    ? reject(err)
    : Promise
      .resolve(conn
        .db(process.env.DATABASE_NAME)
        .collection('polls')
      )
      .then(resolve)
      .then(() => conn.close())
  ));

/**
 * Gets a poll document by its unique identifier.
 *
 * @function {String -> Promise<Poll>}
 */
exports.get = pollId => connect()
  .then(db => db
    .findOne(
      {'_id': new ObjectID(pollId)}
    )
    .catch(err => {
      console.error('db findOne() failure', err);
      throw err;
    })
  );

/**
 * Create a poll document attached to a userId and channelId
 * where values is an array of string where the first element
 * is the question label and the others are the response labels
 *
 * @function {(String, String, [String] -> Promise<Poll>)}
 */
exports.create = (userId, channelId, values) => connect()
  .then(db => db
    .insertOne({
      channelId: channelId,
      time     : new Date().getTime(),
      ownerId  : userId,
      question : values[0],
      responses: values
        .slice(1)
        .reduce((xs, x, i) => [...xs, response(i + 1, x)], [])
    })
    /* Same as .then(result => result.ops[0]) */
    .then(({ops:[x]}) => x)
    .catch(err => {
      console.error('db insertOne() failure', err);
      throw err;
    })
  );

/**
 * Update a poll document by pollId
 *
 * @function {(String, Poll -> Promise<CommandResult>)}
 */
exports.update = (pollId, data) => connect()
  .then(db => db
    .updateOne(
      {'_id': new ObjectID(pollId)},
      {$set: data}
    )
    .catch(err => {
      console.error('db updateOne() failure', err);
      throw err;
    })
  );

/**
 * Creates a response entry.
 *
 * @function {(Int, String, SlackAttachmentType) -> ResponseEntry}
 */
const response = (id, text, type = 'button') => ({
  'type' : type,
  'name' : id,
  'value': id,
  'votes': 0,
  'users': [],
  text
});
