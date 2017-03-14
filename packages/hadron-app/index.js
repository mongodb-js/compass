/**
 * The global app singleton.
 */
const app = {
  extend: function(...args) {
    args.unshift(this);
    return Object.assign.apply(null, args);
  }
};

module.exports = app;
