var Base = require('./base');

/**
 * Key describes the state for a single key of a clause.
 * @type {Base}
 *
 * @property {string} content  the key name
 * @property {string} buffer   (derived) same as content, read-only.
 * @property {string} valid    (derived) valid if non-empty.
 */
var Key = module.exports = Base.extend({
  props: {
    content: {
      type: 'string',
      default: ''
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'Key'
    }
  },
  derived: {
    buffer: {
      cache: false,
      deps: ['content'],
      fn: function() {
        return this.content;
      }
    },
    valid: {
      cache: false,
      deps: ['buffer'],
      fn: function() {
        return this.buffer !== '';
      }
    }
  },
  serialize: function() {
    return this.buffer;
  },
  parse: function(attrs, options) {
    return {
      content: attrs
    };
  }
});
