var View = require('ampersand-view');

var indexTemplate = require('../templates').indexes.index;
var indexItemTemplate = require('../templates').indexes['index-item'];
var numeral = require('numeral');
var moment = require('moment');
var _ = require('lodash');

var electron = require('electron');
var shell = electron.shell;

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
  events: {
    'click i.link': 'linkIconClicked'
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
    this.model.fields.each(function(field) {
      debug('- ', field.field, field.value, field.geo);
    });

    this.renderWithTemplate(this);
  },
  linkIconClicked: function(event) {
    event.preventDefault();
    event.stopPropagation();
    var urlMap = {
      single: 'https://docs.mongodb.org/manual/core/index-single/',
      compound: 'https://docs.mongodb.org/manual/core/index-compound/',
      unique: 'https://docs.mongodb.org/manual/core/index-unique/',
      partial: 'https://docs.mongodb.org/manual/core/index-partial/',
      sparse: 'https://docs.mongodb.org/manual/core/index-sparse/',
      ttl: 'https://docs.mongodb.org/manual/core/index-ttl/',
      '2d': 'https://docs.mongodb.org/manual/core/2d/',
      '2dsphere': 'https://docs.mongodb.org/manual/core/2dsphere/',
      geoHaystack: 'https://docs.mongodb.org/manual/core/geohaystack/',
      text: 'https://docs.mongodb.org/manual/core/index-text/',
      hashed: 'https://docs.mongodb.org/manual/core/index-hashed/',
      unknown: null
    };
    var url = _.get(urlMap, event.target.parentNode.innerText, 'unknown');
    if (url) {
      shell.openExternal(url);
    }
  }
});

module.exports = View.extend({
  template: indexTemplate,
  props: {
    ns: {
      type: 'string',
      default: ''
    },
    visible: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  bindings: {
    ns: {
      hook: 'ns'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
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
