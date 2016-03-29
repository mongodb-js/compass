var View = require('ampersand-view');

var indexTemplate = require('../templates').indexes.index;
var indexItemTemplate = require('../templates').indexes['index-item'];
var numeral = require('numeral');
var moment = require('moment');

var debug = require('debug')('mongodb-compass:indexes');

var IndexItemView = View.extend({
  template: indexItemTemplate,
  derived: {
    index_size: {
      deps: ['model.size'],
      fn: function() {
        var size = this.format('size', true);
        return size.split(' ')[0];
      }
    },
    index_size_unit: {
      deps: ['model.size'],
      fn: function() {
        var size = this.format('size', true);
        return size.split(' ')[1];
      }
    },
    usage_stats: {
      deps: ['model.usageCount'],
      fn: function() {
        return this.format('usageCount', false);
      }
    },
    usage_since: {
      deps: ['model.usageSince'],
      fn: function() {
        return moment(this.model.usageSince).format('lll');
      }
    }
  },
  bindings: {
    index_size: {
      hook: 'index-size'
    },
    index_size_unit: {
      hook: 'index-size-unit'
    },
    usage_stats: {
      hook: 'usage-count'
    },
    'usage_since': {
      hook: 'usage-since'
    }
  },
  /**
   * Use [numeral.js][numeral.js] to format a collection stat as a nice string.
   * @param {String} propertyName of `this.model` to format as a string.
   * @param {Boolean} bytes flag whether or not the result is a byte size.
   * @return {String} Nicely formatted value.
   * [numeral.js]: http://numeraljs.com/
   */
  format: function(propertyName, bytes) {
    var value = this.model.get(propertyName) || 0;
    var precision = value <= 1000 ? '0' : '0.0';
    var format = bytes ? ' b' : 'a';
    return numeral(value).format(precision + format);
  },
  render: function() {
    // @debug thomasr remove these lines
    this.model.size = 153335495;
    this.model.usageCount = 6445;
    this.model.usageSince = new Date('2016-01-03');
    // --

    this.model.fields.each(function(field) {
      debug('- ', field.field, field.value, field.geo);
    });

    this.renderWithTemplate(this);
  }
});

module.exports = View.extend({
  template: indexTemplate,
  props: {
    ns: {
      type: 'string',
      default: ''
    }
  },
  bindings: {
    ns: {
      hook: 'ns'
    }
  },
  initialize: function() {
    this.listenTo(this.model, 'sync', this.onModelSynced.bind(this));
  },
  onModelSynced: function() {
    this.ns = this.model._id;
  },
  render: function() {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.indexes, IndexItemView,
      this.queryByHook('indexes'));
  }
});
