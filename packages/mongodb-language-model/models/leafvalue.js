var Value = require('./value');
var bson = require('bson');
// var debug = require('debug')('models:leafvalue');

/**
 * LeafValue contains the leaf values of the query tree. Those can be of any type, including
 * object and array.
 *
 * @type {Base}
 *
 * @property {string} type    holds the type of the value.
 * @property {any} content    holds the raw value, writeable.
 * @property {any} buffer     returns the actual (potentially cleaned-up) value. read-only.
 * @property {boolean} valid  is always true.
 */
module.exports = Value.extend({
  props: {
    content: {
      type: 'any',
      default: null
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'LeafValue'
    }
  },
  derived: {
    type: {
      cache: false,
      deps: ['content'],
      /* eslint complexity: 0 */
      fn: function() {
        if (this.content === null) return 'null';
        if (this.content instanceof Date) return 'date';
        if (this.content instanceof Array) return 'array';
        if (this.content instanceof RegExp) return 'regex';
        if (this.content instanceof bson.ObjectID) return 'objectid';
        if (this.content instanceof bson.Long) return 'long';
        if (this.content instanceof bson.Double) return 'double';
        if (this.content instanceof bson.Timestamp) return 'timestamp';
        if (this.content instanceof bson.Symbol) return 'symbol';
        if (this.content instanceof bson.Code) return 'code';
        if (this.content instanceof bson.MinKey) return 'minkey';
        if (this.content instanceof bson.MaxKey) return 'maxkey';
        if (this.content instanceof bson.DBRef) return 'dbref';
        if (this.content instanceof bson.Binary) return 'binary';
        return typeof this.content; // string, number, boolean, object, null
      }
    },
    buffer: {
      cache: false,
      deps: ['content'],
      fn: function() {
        return this.content;
      }
    },
    valid: {
      cache: false,
      deps: ['content'],
      fn: function() {
        // have to assume it's a valid value
        return true;
      }
    }
  },
  parse: function(attrs) {
    return {
      content: attrs
    };
  },
  serialize: function() {
    return this.buffer;
  }
});
