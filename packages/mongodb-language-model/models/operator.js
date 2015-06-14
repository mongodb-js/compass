var Base = require('./base'),
    debug = require('debug')('models:operator');

/**
 * Operator is the common class for all possible operators, including 
 * LogicalOperator, ListOperator, ValueOperator.
 * 
 * @type {Base}
 */
var Operator = module.exports = Base.extend({
  derived: {
    key: {
      deps: ['parent'],
      cache: false,
      fn: function () {
        // for LeafValues wanting to listen to the key: 
        // this operator's key is really its parent key
        return this.parent ? this.parent.key : null;
      }
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'Operator'   
    }
  },
});
