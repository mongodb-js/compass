var Operator = require('./operator'),
    ChildCollection = require('./childcollection'),
    LeafValue = require('./leafvalue'),
    debug = require('debug')('models:list-operator');


/**
 * ValueCollection is a collection of Values 
 * @type {AmpersandCollection}
 */
var ValueCollection = ChildCollection.extend({
  model: LeafValue,
  parse: function (attrs, options) {
    // build models here, because ampersand-collection.js:75 can't pass "null" and "false" as models
    if (attrs instanceof Array) {
      return attrs.map(function (a) {
        return new LeafValue(a, options);
      });
    }
    return attrs;
  }
});



/**
 * ListOperator is an operator that takes an array of values as its value,
 * e.g. $in: [1, 2, 3]. Its `.values` property is a collection of LeafValue.
 * 
 * @type {Operator}
 */
var ListOperator = module.exports = Operator.extend({
  props: {
    operator: {
      type: 'string',
      required: true,
      values: ['$in', '$nin', '$elemMatch']
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'ListOperator'   
    }
  },
  derived: {
    buffer: {
      deps: ['content'],
      cache: false,
      fn: function () {
        var doc = {};
        doc[this.operator] = this.values.serialize();
        return doc;
      }
    },
    valid: {
      deps: ['value'],
      cache: false, 
      fn: function () {
        // operator is always valid, return valid if all values are valid
        return this.values.all(function (value) { 
          return value.valid;
        });
      }
    }
  },
  collections: {
    values: ValueCollection
  },  
  initialize: function (attrs, options) {
    // pass down schema
    this.listenTo(this, 'change:schema', this.schemaChanged);
    this.schema = options ? options.schema : null;
  },
  parse: function (attrs, options) {
    // assume {$op: [v1, v2, v3]} format
    var key = _.keys(attrs)[0];
    var values = attrs[key];
    if (!(values instanceof Array)) throw TypeError('value for operator ' + key + ' must be an array.');
    return {operator: key, values: values};
  },
  serialize: function () {
    return this.buffer;
  },
  schemaChanged: function () {
    this.values.forEach(function (value) {
      value.schema = this.schema;
    }.bind(this));
  }
});
