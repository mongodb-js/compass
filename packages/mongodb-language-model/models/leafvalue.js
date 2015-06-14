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
 * @property {any} content    holds the raw value, views change this property. 
 * @property {any} buffer     returns the actual (potentially cleaned-up) value. read-only.
 * @property {boolean} valid  is true if the value matches the type and other checks.
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
      fn: function () {
        if (this.content === null) return 'null';
        if (this.content instanceof Date) return 'date';
        if (this.content instanceof Array) return 'array';
        return typeof this.content;
      }
    },
    buffer: {
      cache: false,
      deps: ['content'],
      fn: function () {
        return this.content;
      }
    },
    valid: {
      cache: false,
      deps: ['content', 'type'],
      fn: function () {
        if (this.schema && this.parent && this.parent.key) {
          var key = this.parent.key.buffer;
          var keyType = this.schema.getType(key);
          // cast text and category to string for this comparison
          if (keyType === 'text' || keyType === 'category') {
            keyType = 'string';
          }
          return keyType === this.type;
        }          
        // no schema, have to assume it's a valid value
        return true;
      }
    }
  },
  initialize: function (attrs, options) {
    this.schema = options ? options.schema : null;
    if (this.parent && this.parent.key) this.listenTo(this.parent.key, 'change:buffer', this.keyChanged);
  },
  parse: function (attrs, options) {
    return {content: attrs};
  },
  serialize: function () {
    return this.buffer;
  },
  keyChanged: function () {
    var oldType = this.previousAttributes().type;
    // determine new type from schema if present
    if (this.schema && this.parent) {
      this.type = this.schema.getType(this.parent.key.buffer) || 'empty';
      if (oldType !== this.type) {
        // current value incompatible with new type, convert
        switch (this.type) {
          case 'number': this.content = 0; break;
          case 'boolean': this.content = false; break;
          case 'category': this.content = this.schema.getValues(this.parent.key.buffer)[0] || ''; break;
          case 'text': // fall-through
          case 'string': this.content = (typeof this.content === 'string') ? this.content : ''; break;
          case 'date': this.content = new Date(); break;
          case 'empty': // fall-through
          case 'null':  // fall-through
          default: this.content = null; break;
        }
      }
      if (oldType === this.type && this.type === 'category') {
        // special case, categories change, views need to load new suggestions
        this.content = this.schema.getValues(this.parent.key.buffer)[0] || '';
        this.trigger('change:type');
      }
    }
  }
});
