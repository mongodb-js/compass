const toArray = require('lodash/toArray');
const extend = require('lodash/assign');

/**
 * The global app singleton.
 */
const app = {
  extend: function() {
    const args = toArray(arguments);
    args.unshift(this);
    return extend.apply(null, args);
  }
};

module.exports = app;
