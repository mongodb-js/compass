var Operator = require('./operator'),
  Value = require('./value'),
  ChildCollection = require('./childcollection'),
  debug = require('debug')('models:logical-operator');


/**
 * OperatorCollection is a collection of Operators
 * @type {AmpersandCollection}
 */
var OperatorCollection = ChildCollection.extend({
  model: function(attrs, options) {
    var key = _.keys(attrs)[0];
    var value = attrs[key];
    if (value instanceof Array) {
      return new ListOperator(attrs, options);
    } else {
      return new ValueOperator(attrs, options);
    }
  },

  isModel: function(model) {
    return (model instanceof Operator);
  }
});


/**
 * OperatorObject represents an object containing operator values,
 * either ListOperator or ValueOperator. The OperatorObject derives
 * from Value.
 *
 * @type {Value}
 */
var OperatorObject = module.exports = Value.extend({
  collections: {
    operators: OperatorCollection
  },
  session: {
    className: {
      type: 'string',
      default: 'OperatorObject'
    }
  },
  derived: {
    key: {
      deps: ['parent'],
      cache: false,
      fn: function() {
        // pass parent's key through operators to LeafValues
        return this.parent ? this.parent.key : null;
      }
    },
    buffer: {
      deps: ['operators'],
      cache: false,
      fn: function() {
        var result = _.assign.apply(null, this.operators.map(function(op) {
          return op.serialize();
        }));
        if (result === undefined) {
          result = {};
        }
        return result;
      }
    },
    valid: {
      deps: ['operators'],
      cache: false,
      fn: function() {
        return this.operators.every(function(op) {
          return op.valid;
        });
      }
    }
  },
  parse: function(attrs, options) {
    // turn {$gt: 5, $lt: 9} into [ {$gt: 5}, {$lt: 9} ]
    var result = _.map(attrs, function(v, k) {
      var doc = {};
      doc[k] = v; return doc;
    });
    return {
      operators: result
    };
  },
  serialize: function() {
    return this.buffer;
  }
});
