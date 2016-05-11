var View = require('ampersand-view');
var IndexItemView = require('./index-item');

var metrics = require('mongodb-js-metrics')();
var _ = require('lodash');
var semver = require('semver');
var app = require('ampersand-app');

var indexTemplate = require('./index.jade');
// var debug = require('debug')('mongodb-compass:indexes');


/**
 * View of the entire Indexes Table
 */
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
    },
    // no refine bar for index view
    hasRefineBar: ['boolean', true, false]
  },
  session: {
    appVersion: 'string'
  },
  // only show usage column if version is >= 3.2.0, lower versions
  // don't support index usage stats.
  derived: {
    showUsageColumn: {
      deps: ['appVersion'],
      fn: function() {
        if (!this.appVersion) {
          return false;
        }
        return semver.gte(this.appVersion, '3.2.0');
      }
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
      type: 'switchClass',
      name: 'active',
      cases: {
        'Name and Definition': '[data-hook=th-name]',
        'Type': '[data-hook=th-type]',
        'Size': '[data-hook=th-size]',
        'Usage': '[data-hook=th-usage]',
        'Properties': '[data-hook=th-properties]'
      }
    },
    sortOrder: {
      type: 'class',
      selector: 'i.sort'
    },
    showUsageColumn: {
      type: 'toggle',
      selector: '.usage-column'
    }
  },
  events: {
    'click th': 'onHeaderClicked'
  },
  initialize: function() {
    this.listenTo(this.model, 'sync', this.onModelSynced.bind(this));
    // to detect version and show/hide usage column accordingly
    this.listenToOnce(app.instance, 'sync', this.onInstanceSynced.bind(this));
    this.on('change:visible', this.onVisibleChanged.bind(this));
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
    this._computeMetrics();
  },
  _computeMetrics: function() {
    var metadata = {};
    // total index count
    metadata['index count'] = this.model.indexes.length;

    // average fields per index
    var numFields = _.sum(this.model.indexes.map(function(idx) {
      return idx.fields.length;
    }));
    metadata['average fields per index'] = numFields / metadata['index count'];

    // are certain types of indexes included
    metadata['geo index present'] = !!this.model.indexes.find('geo');
    metadata['text index present'] = !!this.model.indexes.find('text');
    metadata['hashed index present'] = !!this.model.indexes.find('hashed');

    // count index properties
    metadata['unique index count'] = this.model.indexes.filter('unique').length;
    metadata['sparse index count'] = this.model.indexes.filter('sparse').length;
    metadata['partial index count'] = this.model.indexes.filter('partial').length;
    metadata['ttl index count'] = this.model.indexes.filter('ttl').length;
    metadata['single index count'] = this.model.indexes.filter('single').length;

    metrics.track('Indexes', 'detected', metadata);
  },
  onVisibleChanged: function() {
    if (this.visible) {
      this.parent.refineBarView.visible = this.hasRefineBar;
    }
  },
  onInstanceSynced: function() {
    this.appVersion = _.get(app.instance, 'build.version', null);
  },
  onHeaderClicked: function(e) {
    var headerText = e.target.innerText;
    if (this.sortField === headerText) {
      // same header clicked again, just reverse sort order
      this.toggle('sortOrder');
    } else {
      // new header clicked, reset sort order depending on sort field
      this.sortField = headerText;
      this.sortOrder = headerText === 'Name and Definition' ?
        'fa-sort-asc' : 'fa-sort-desc';
    }
    var indexes = this.model.indexes;
    var field;
    if (this.sortField === 'Name and Definition') {
      field = 'name';
    } else if (this.sortField === 'Usage') {
      field = 'usageCount';
    } else {
      field = this.sortField.toLowerCase();
    }
    // set a sort function depending on sort field and order
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
    // initially sort indexes by name ascending
    this.model.indexes.comparator = 'name';
    this.model.indexes.sort();
    this.renderCollection(this.model.indexes, IndexItemView,
      this.queryByHook('indexes'));
  }
});
