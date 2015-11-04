var Operator = require('./operator');
var LeafValue = require('./leafvalue');
var _ = require('lodash');
var definitions = require('./definitions');
// var debug = require('debug')('models:value-operator');


/**
 * ValueOperator holds an operator key and a single value,
 * e.g. {"$gt": 5}, or {"$exists": true}
 *
 * @type {Operator}
 */
module.exports = Operator.extend({
  props: {
    operator: {
      type: 'string',
      required: true,
      values: definitions.valueOperators
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'ValueOperator'
    }
  },
  children: {
    value: LeafValue
  },
  derived: {
    buffer: {
      deps: ['value', 'operator'],
      cache: false,
      fn: function() {
        var doc = {};
        doc[this.operator] = this.value.buffer;
        return doc;
      }
    },
    valid: {
      deps: ['value'],
      cache: false,
      fn: function() {
        // operator is always valid
        return this.value.valid;
      }
    }
  },
  initialize: function() {
    // bubble up buffer change events
    this.listenTo(this.value, 'change:buffer', this.bufferChanged);
  },
  parse: function(attrs) {
    // assume {$op: value} format
    if (attrs) {
      var key = _.keys(attrs)[0];
      var value = attrs[key];
      return {
        operator: key,
        value: {
          content: value
        }
      };
    }
    return {};
  },
  serialize: function() {
    return this.buffer;
  }
});
