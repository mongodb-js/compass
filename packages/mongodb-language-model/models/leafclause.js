var Clause = require('./clause');
var Key = require('./key');
var LeafValue = require('./leafvalue');
var OperatorObject = require('./opobject');
var _ = require('lodash');
// var debug = require('debug')('models:clause');

/**
 * LeafClause describes a single clause ( e.g. `{age: 31}` ) of the query. It has
 * a key and value model and passes changes to its sub-buffers up to the top.
 *
 * @type {Clause}
 *
 * @property {boolean} valid   (derived) is true if both key and value are valid.
 * @property {any} buffer      (derived) a simple object with key and value.
 */
module.exports = Clause.extend({
  idAttribute: 'id',
  props: {
    value: {
      type: 'any',
      default: null
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'LeafClause'
    }
  },
  children: {
    key: Key
  },
  derived: {
    valid: {
      cache: false,
      deps: ['key', 'value'],
      fn: function() {
        return this.key && this.value && this.key.valid && this.value.valid;
      }
    },
    id: {
      deps: ['key'],
      fn: function() {
        return this.key ? this.key.buffer : '';
      }
    },
    buffer: {
      cache: false,
      deps: ['key', 'value'],
      fn: function() {
        if (!this.valid) {
          return null;
        }
        var doc = {};
        doc[this.key.buffer] = this.value.buffer;
        return doc;
      }
    }
  },
  _initializeValue: function(obj, options) {
    options = _.assign(options, {
      parse: true,
      parent: this
    });

    if (typeof obj === 'object') {
      var keys = _.keys(obj);
      if (_.some(keys, function(key) {
        return key.indexOf('$') === 0;
      })) {
        // object has key(s) starting with $, it's not a leaf object
        return new OperatorObject(obj, options);
      }
    }
    return new LeafValue(obj, options);
  },
  initialize: function(attrs, options) {
    // initialize value manually (since it is polymorphic)
    if (attrs) {
      this.value = this._initializeValue(attrs.value, options);
    } else {
      // if no attrs given use a null LeafValue as placeholder
      options = _.assign(options, {
        parse: true,
        parent: this
      });
      this.value = new LeafValue(null, options);
    }

    // bubble up buffer change events
    this.listenTo(this.key, 'change:buffer', this.bufferChanged);
    this.listenTo(this.value, 'change:buffer', this.bufferChanged);

    // listen to new value
    this.listenTo(this, 'change:value', function(self, val) {
      this.stopListening(this.previousAttributes().value);
      this.listenTo(val, 'change:buffer', this.bufferChanged);
    });
  },
  parse: function(attrs) {
    var key = _.keys(attrs)[0];
    var value = attrs[key];
    return {
      key: {
        content: key
      },
      value: value
    };
  },
  serialize: function() {
    return this.buffer;
  }
});
