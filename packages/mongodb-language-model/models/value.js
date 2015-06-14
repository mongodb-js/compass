var Base = require('./base'),
    debug = require('debug')('models:value');

/**
 * Value is the common class for all possible values, including LeafValue and Operator.
 * @type {Base}
 */
var Value = module.exports = Base.extend({
  session: {
    className: {
      type: 'string',
      default: 'Value'   
    }
  }
});
