var View = require('ampersand-view');
var _ = require('lodash');
var numeral = require('numeral');
var moment = require('moment');
var format = require('util').format;
var tooltipMixin = require('../tooltip-mixin');
var IndexDefinitionView = require('./index-definition');

var semver = require('semver');
var app = require('ampersand-app');
var electron = require('electron');
var shell = electron.shell;

var indexItemTemplate = require('./index-item.jade');

/**
 * View of a single index row in the table
 */
module.exports = View.extend(tooltipMixin, {
  template: indexItemTemplate,
  session: {
    appVersion: 'string'
  },
  derived: {
    showUsageColumn: {
      deps: ['appVersion'],
      fn: function() {
        if (!this.appVersion) {
          return false;
        }
        return semver.gte(this.appVersion, '3.2.0');
      }
    },
    // tooltips for various types and properties
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
    progressbar_tooltip_message: {
      deps: ['model.relativeSize'],
      fn: function() {
        return format('%s% compared to largest index', numeral(this.model.relativeSize).format('0'));
      }
    },
    usage_tooltip_message: {
      deps: ['usage_stats'],
      fn: function() {
        return format('%s index hits since index creation or last\n server restart', this.usage_stats);
      }
    },
    // split index size into value and unit (e.g. KB, MB)
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
    }
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
    usage_tooltip_message: {
      selector: '.usage',
      type: function(el) {
        // need to set `title` and `data-original-title` due to bug in bootstrap's tooltip
        // @see https://github.com/twbs/bootstrap/issues/14769
        this.tooltip({
          el: el,
          title: this.usage_tooltip_message,
          placement: 'bottom',
          container: 'body'
        }).attr('data-original-title', this.usage_tooltip_message);
      }
    },
    showUsageColumn: {
      type: 'toggle',
      selector: '.usage-column'
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
    'model.relativeSize': {
      hook: 'progressbar',
      type: function(el, value) {
        el.style.width = value + '%';
      }
    }
  },
  subviews: {
    indexDefinitionView: {
      hook: 'index-definition-subview',
      prepareView: function(el) {
        return new IndexDefinitionView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    }
  },
  initialize: function() {
    // to detect version and show/hide usage column accordingly
    this.onInstanceSynced();
    if (!this.appVersion) {
      this.listenToOnce(app.instance, 'sync', this.onInstanceSynced.bind(this));
    }
  },
  onInstanceSynced: function() {
    this.appVersion = _.get(app.instance, 'build.version', null);
  },
  /**
   * Use [numeral.js][numeral.js] to format a collection stat as a nice string.
   *
   * @param {String} propertyName of `this.model` to format as a string.
   * @param {Boolean} bytes flag whether or not the result is a byte size.
   * @return {String} Nicely formatted value.
   *
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
    // which pill info sprinkles go to which website
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
