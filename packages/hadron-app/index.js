const _ = require('lodash');

/**
 * The global app singleton.
 */
const app = {
  extend: function() {
    const args = _.toArray(arguments);
    args.unshift(this);
    return _.assign.apply(null, args);
  }
};

module.exports = app;
