const yargs = require('yargs');

exports.parse = cs => yargs
  .option({
    limit: {
      default: 0,
      type   : 'number'
    },
    anonymous: {
      default: false,
      type   : 'boolean'
    }
  })
  .parse(cs.replace(/“|”/g, '"'));

