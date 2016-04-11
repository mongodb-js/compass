var View = require('ampersand-view');
var indexTemplate = require('../templates').indexes.index;
var indexItemTemplate = require('../templates').indexes['index-item'];
var tooltipMixin = require('../tooltip-mixin');
var numeral = require('numeral');
var moment = require('moment');
var format = require('util').format;
var _ = require('lodash');

var electron = require('electron');
var shell = electron.shell;

// var debug = require('debug')('mongodb-compass:indexes');

var IndexItemView = View.extend(tooltipMixin, {
  template: indexItemTemplate,
  derived: {
    partial_tooltip: {
      deps: ['model.partial', 'model.extra'],
      fn: function() {
        if (!this.model.partial) {
          return '';
        }
        return format('partialFilterExpression: %j', this.model.extra.partialFilterExpression);
      }
    },
    text_tooltip: {
      deps: ['model.text', 'model.extra'],
      fn: function() {
        if (!this.model.text) {
          return '';
        }
        var info = _.pick(this.model.extra, ['weights', 'default_language', 'language_override']);
        return _.map(info, function(v, k) {
          return format('%s: %j', k, v);
        }).join('\n');
      }
    },
    ttl_tooltip: {
      deps: ['model.ttl', 'model.extra'],
      fn: function() {
        if (!this.model.ttl) {
          return '';
        }
        return format('expireAfterSeconds: %d', this.model.extra.expireAfterSeconds);
      }
    },
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
    },
    progressbar_tooltip_message: {
      deps: ['model.relativeSize'],
      fn: function() {
        return format('%s% compared to largest index', numeral(this.model.relativeSize).format('0'));
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
    progressbar_tooltip_message: {
      selector: '.progress',
      type: function(el) {
        // need to set `title` and `data-original-title` due to bug in bootstrap's tooltip
        // @see https://github.com/twbs/bootstrap/issues/14769
        this.tooltip({
          el: el,
          title: this.progressbar_tooltip_message,
          placement: 'bottom',
          container: 'body'
        }).attr('data-original-title', this.progressbar_tooltip_message);
      }
    },
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
    },
    'model.relativeSize': {
      hook: 'progressbar',
      type: function(el, value) {
        el.style.width = value + '%';
      }
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
    var fmt = bytes ? ' b' : 'a';
    return numeral(value).format(precision + fmt);
  },
  render: function() {
    this.renderWithTemplate(this);
    // activate all tooltips
    _.each(this.queryAll('.property[data-toggle=tooltip]'), function(el) {
      this.tooltip({
        el: el,
        placement: 'bottom',
        container: 'body'
      });
    }.bind(this));
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
    },
    sortField: {
      type: 'string',
      default: 'Name and Definition'
    },
    sortOrder: {
      type: 'string',
      default: 'fa-sort-asc',
      values: ['fa-sort-asc', 'fa-sort-desc']
    }
  },
  bindings: {
    ns: {
      hook: 'ns'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    sortField: {
      type: 'switch',
      cases: {
        'Name and Definition': '[data-hook=sort-name]',
        'Size': '[data-hook=sort-size]',
        'Utilization': '[data-hook=sort-utilization]',
        'Type': '[data-hook=sort-type]',
        'Properties': '[data-hook=sort-properties]'
      }
    },
    sortOrder: {
      type: 'class',
      selector: 'i.sort'
    }
  },
  events: {
    'click th': 'onHeaderClicked'
  },
  initialize: function() {
    this.listenTo(this.model, 'sync', this.onModelSynced.bind(this));
  },
  onModelSynced: function() {
    this.ns = this.model._id;
    // compute relative sizes
    var maxSize = this.model.indexes.max(function(idx) {
      return idx.size;
    }).size;
    this.model.indexes.each(function(idx) {
      idx.relativeSize = idx.size / maxSize * 100;
    });
  },
  onHeaderClicked: function(e) {
    var headerText = e.target.innerText;
    if (this.sortField === headerText) {
      this.toggle('sortOrder');
    } else {
      this.sortField = headerText;
      this.sortOrder = 'fa-sort-asc';
    }
    var indexes = this.model.indexes;
    var field;
    if (this.sortField === 'Name and Definition') {
      field = 'name';
    } else if (this.sortField === 'Utilization') {
      field = 'usageCount';
    } else {
      field = this.sortField.toLowerCase();
    }
    // @todo thomasr move .type into index-model to enable sorting on type
    var order = this.sortOrder === 'fa-sort-asc' ? 1 : -1;
    indexes.comparator = function(a, b) {
      if (a[field] > b[field]) {
        return order;
      }
      if (a[field] < b[field]) {
        return -order;
      }
      return 0;
    };
    indexes.sort();
  },
  render: function() {
    this.renderWithTemplate(this);
    this.model.indexes.comparator = 'name';
    this.model.indexes.sort();
    this.renderCollection(this.model.indexes, IndexItemView,
      this.queryByHook('indexes'));
  }
});
