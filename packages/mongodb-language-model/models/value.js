var Base = require('./base');

/**
 * Value is the common class for all possible values, including LeafValue and Operator.
 * @type {Base}
 */
module.exports = Base.extend({
  session: {
    className: {
      type: 'string',
      default: 'Value'
    }
  }
});
