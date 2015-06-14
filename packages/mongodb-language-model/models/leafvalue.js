var Value = require('./value'),
  debug = require('debug')('models:leafvalue');

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

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
var LeafValue = module.exports = Value.extend({
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
      fn: function() {
        if (this.content === null) return 'null';
        if (this.content instanceof Date) return 'date';
        if (this.content instanceof Array) return 'array';
        return typeof this.content;
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
  parse: function(attrs, options) {
    return {
      content: attrs
    };
  },
  serialize: function() {
    return this.buffer;
  }
});
