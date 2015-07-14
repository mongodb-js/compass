var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-list');
var RefineBarView = require('../refine-view');
var SamplingMessageView = require('../sampling-message');
var MongoDBCollection = require('../models/mongodb-collection');
var SampledSchema = require('../models/sampled-schema');
var debug = require('debug')('scout:home:collection');
var app = require('ampersand-app');

var MongoDBCollectionView = View.extend({
  template: require('./collection.jade'),
  props: {
    sidebar_open: {
      type: 'boolean',
      default: false
    },
    visible: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    is_empty: {
      deps: ['schema_sample_size'],
      fn: function() {
        return this.schema_sample_size === 0;
      }
    },
    is_sample: {
      deps: ['schema_sample_size'],
      fn: function() {
        return this.schema_sample_size === app.queryOptions.limit;
      }
    },
    sample_size_message: {
      deps: ['schema_sample_size'],
      fn: function() {
        return format('%d %s', app.schema.sample_size,
          pluralize('document', app.schema.sample_size));
      }
    }
  },
  events: {
    'click .splitter': 'onSplitterClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    sidebar_open: {
      type: 'booleanClass',
      yes: 'sidebar-open',
      hook: 'json-sidebar-toggle-class'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  children: {
    model: MongoDBCollection,
    schema: SampledSchema
  },
  onStatusChanged: function(statusbar) {
    if (statusbar.visible) return;
    if (this.is_empty) {
      this.queryByHook('empty').classList.remove('hidden');
      this.queryByHook('non-empty').classList.add('hidden');
    } else {
      this.queryByHook('empty').classList.add('hidden');
      this.queryByHook('non-empty').classList.remove('hidden');
    }
  },
  initialize: function() {
    app.statusbar.watch(this, this.schema);
    this.listenTo(app.queryOptions, 'change', this.onQueryChanged.bind(this));
    this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
    this.listenTo(app.statusbar, 'change:visible', this.onStatusChanged);
  },
  onCollectionChanged: function() {
    var ns = this.parent.ns;
    if (!ns) {
      this.visible = false;
      debug('not updating because parent has no collection namespace.');
      return;
    }
    this.visible = true;

    this.schema.ns = this.model._id = ns;
    debug('updating namespace to `%s`', ns);
    this.schema.reset();
    this.schema.fetch({
      message: 'Analyzing documents...'
    });
    this.model.fetch();
  },
  onQueryChanged: function() {
    this.schema.refine(app.queryOptions.serialize(), {
      message: 'Analyzing documents...'
    });
  },
  onSplitterClick: function() {
    this.toggle('sidebar_open');
  },
  subviews: {
    stats: {
      hook: 'stats-subview',
      prepareView: function(el) {
        return new CollectionStatsView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    refine_bar: {
      hook: 'refine-bar',
      prepareView: function(el) {
        return new RefineBarView({
          el: el,
          parent: this,
          model: app.queryOptions
        });
      }
    },
    fields: {
      hook: 'fields-subview',
      prepareView: function(el) {
        return new FieldListView({
          el: el,
          parent: this,
          collection: this.schema.fields
        });
      }
    },
    documents: {
      hook: 'documents-subview',
      prepareView: function(el) {
        return new DocumentListView({
          el: el,
          parent: this,
          collection: this.schema.documents
        });
      }
    },
    sampling_message: {
      hook: 'sampling-message-subview',
      prepareView: function(el) {
        return new SamplingMessageView({
          el: el,
          parent: this
        });
      }
    }
  }
});

module.exports = MongoDBCollectionView;
