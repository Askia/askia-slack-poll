/**
 * Dispatches a user vote.
 *
 * @param {SlackUser} user
 * The user for which has voted.
 *
 * @param {Poll} poll
 * The poll to which the user has voted.
 *
 * @param {Promise<PollResponse>} response
 * The response for which the user has voted.
 */
exports.dispatch = (user, poll, response) =>
  new Promise((resolve, reject) => {
    if (votesExpired(poll)) {
      reject(new Error(VOTE_EXPIRED));
    }
    else if (withoutVoteLimit(poll)) {
      if (hasVoted(user, response)) {
        resolve(decreaseUserVote(user, poll, response));
      }
      else {
        resolve(increaseUserVote(user, poll, response));
      }
    }
    else {
      if (hasVoted(user, response)) {
        resolve(decreaseUserVote(user, poll, response));
      }
      else if (canVote(user, poll)) {
        resolve(increaseUserVote(user, poll, response));
      }
      else {
        reject(new Error(VOTE_LIMIT_REACHED));
      }
    }
  });

/**
 * Increase a user vote for a spefic poll response.
 *
 * @param {SlackUser} user
 * The user for which has voted.
 *
 * @param {Poll} poll
 * The poll to which the user has voted.
 *
 * @param {PollResponse} response
 * The response for which the user has voted.
 */
const increaseUserVote = (user, poll, response) => ({
  [responsePath(poll, response)]: {
    ...response,
    "votes": response.votes + 1,
    "users": [...response.users, user.name]
  }
});

/**
 * Decrease a user vote for a spefic poll response.
 *
 * @param {SlackUser} user
 * The user for which has unvoted.
 *
 * @param {Poll} poll
 * The poll to which the user has unvoted.
 *
 * @param {PollResponse} response
 * The response for which the user has unvoted.
 */
const decreaseUserVote = (user, poll, response) => ({
  [responsePath(poll, response)]: {
    ...response,
    "votes": response.votes - 1,
    "users": excludeUser(response.users.slice(), user)
  }
});

/**
 * Checks that the specified `poll` does not a `limit` value.
 *
 * @param {Poll} poll
 * The poll object to check.
 *
 * @returns {boolean}
 * Returns `true` is matches the condition otherwise `false`.
 */
const withoutVoteLimit = poll => 0 === poll.limit;

/**
 * Checks that a `user` has already voted for the specified `response`.
 *
 * @param {SlackUser} user
 * The user to check for vote.
 *
 * @param {PollResponse} response
 * The response object where to check for use vote.
 *
 * @returns {boolean}
 * Returns `true` if matches the condition otherwise `false`.
 */
const hasVoted = (user, response) =>
  -1 !== response.users.indexOf(user.name);

/**
 * Checks that a `user` can vote a {@link Poll} with a defined limit.
 *
 * @param {SlackUser} user
 * The user to check for vote capability.
 *
 * @param {Poll} poll
 * The poll object where to check for limit constraint.
 *
 * @returns {boolean}
 * Returns `true` if matches the condition otherwise `false`.
 */
const canVote = (user, poll) =>
  poll.limit >
  poll.responses.filter(x => x.users.includes(user.name)).length;

/**
 * Checks that the ability to vote expirede or not for a specified poll.
 *
 * @param {Poll} poll
 * The poll object to check.
 *
 * @returns {boolean}
 * Returns `true` if matching the condition otherwise `false`.
 */
const votesExpired = poll => {
  if (0 < poll.expires) {
    const date = new Date(poll.time);
    date.setSeconds(date.getSeconds() + poll.expires);
    return date < new Date().getTime();
  }
  else {
    return false;
  }
};

/**
 * Gets the response object path as string.
 *
 * @param {Poll} poll
 * The poll object to which the response belongs to.
 *
 * @param {PollResponse} response
 * The response object where to look for path.
 *
 * @returns {string}
 * Returns the object path.
 */
const responsePath = (poll, response) =>
  `responses.${poll.responses.indexOf(response)}`;

/**
 * Excludes the specified user from a list of user names.
 *
 * @param {string[]} users
 * The list of user names to update.
 *
 * @param {SlackUser} user
 * The user name to exclude from the list.
 *
 * @returns {string[]}
 * Returns updated list of user name.
 */
const excludeUser = (users, user) => {
  const index = users.indexOf(user.name);
  if (index !== -1) users.splice(index, 1);
  return users;
};

/**
 * The ability to vote has expired. This is computed by the `time`
 * and `expires` fields from a poll object.
 *
 * @type {string}
 */
const VOTE_EXPIRED =
  "The ability to vote to this poll has expired";

/**
 * The vote `limit` for a specific user has been reached on a poll.
 *
 * @type {string}
 */
const VOTE_LIMIT_REACHED =
  "Max number of responses limit that you can vote has been reached";
