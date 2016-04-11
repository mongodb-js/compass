var View = require('ampersand-view');

var indexTemplate = require('../templates').indexes.index;
var indexItemTemplate = require('../templates').indexes['index-item'];
var numeral = require('numeral');
var moment = require('moment');
var _ = require('lodash');

var electron = require('electron');
var shell = electron.shell;

// var debug = require('debug')('mongodb-compass:indexes');

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
        return moment(this.model.usageSince).format('Do MMM YYYY');
      }
    },
    index_cardinality: {
      deps: ['model.single', 'model.compound'],
      fn: function() {
        return this.model.single ? 'single' : 'compound';
      }
    },
    index_type: {
      deps: ['model.text', 'model.hashed', 'model.geospatial'],
      fn: function() {
        if (this.model.text) {
          return 'text';
        }
        if (this.model.hashed) {
          return 'hashed';
        }
        if (this.model.geo) {
          return 'geospatial';
        }
        return null;
      }
    }
    // extended_properties: {
    //   deps: ['model.properties'],
    //   fn: function() {
    //     var props = this.model.properties.slice();
    //     if (this.model.text) {
    //       props.push('text');
    //     }
    //     if (this.model.hashed) {
    //       props.push('hashed');
    //     }
    //     if (this.model.geo) {
    //       props.push('geospatial');
    //     }
    //     return props;
    //   }
    // }
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
    },
    index_type: {
      hook: 'index-type'
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
    this.renderWithTemplate(this);
  },
  linkIconClicked: function(event) {
    event.preventDefault();
    event.stopPropagation();
    var urlMap = {
      SINGLE: 'https://docs.mongodb.org/manual/core/index-single/',
      COMPOUND: 'https://docs.mongodb.org/manual/core/index-compound/',
      UNIQUE: 'https://docs.mongodb.org/manual/core/index-unique/',
      PARTIAL: 'https://docs.mongodb.org/manual/core/index-partial/',
      SPARSE: 'https://docs.mongodb.org/manual/core/index-sparse/',
      TTL: 'https://docs.mongodb.org/manual/core/index-ttl/',
      '2D': 'https://docs.mongodb.org/manual/core/2d/',
      '2DSPHERE': 'https://docs.mongodb.org/manual/core/2dsphere/',
      GEOHAYSTACK: 'https://docs.mongodb.org/manual/core/geohaystack/',
      GEOSPATIAL: 'https://docs.mongodb.org/manual/applications/geospatial-indexes/#geospatial-indexes',
      TEXT: 'https://docs.mongodb.org/manual/core/index-text/',
      HASHED: 'https://docs.mongodb.org/manual/core/index-hashed/',
      UNKNOWN: null
    };
    var url = _.get(urlMap, event.target.parentNode.innerText, 'UNKNOWN');
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
