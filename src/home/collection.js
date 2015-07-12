var app = require('ampersand-app');
var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-list');
var RefineBarView = require('../refine-view');
var MongoDBCollection = require('../models/mongodb-collection');
var SampledSchema = require('../models/sampled-schema');
var pluralize = require('pluralize');
var format = require('util').format;
var FastView = require('../fast-view');

var MongoDBCollectionView = View.extend(FastView, {
  template: require('./collection.jade'),
  props: {
    sidebar_open: {
      type: 'boolean',
      default: false
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
    sample_size: {
      hook: 'sample_size'
    },
    'schema.sample_size': {
      hook: 'sampling-message',
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  derived: {
    sample_size: {
      deps: ['schema.sample_size'],
      fn: function() {
        return format('%d %s', this.schema.sample_size,
          pluralize('document', this.schema.sample_size));
      }
    }
  },
  children: {
    model: MongoDBCollection,
    schema: SampledSchema
  },
  initialize: function() {
    app.statusbar.watch(this, this.schema);

    this.schema.ns = this.model.getId();
    this.listenTo(app.queryOptions, 'change', this.onQueryChanged);
    this.fetch(this.model);
    this.fetch(this.schema);
  },
  onQueryChanged: function() {
    this.schema.refine(app.queryOptions.serialize());
  },
  onSplitterClick: function() {
    this.toggle('sidebar_open');
  },
  render: function() {
    this.renderWithTemplate(this);

    this.renderSubview(CollectionStatsView, {
      el: this.queryByHook('stats-subview'),
      model: this.model
    });

    this.renderSubview(RefineBarView, {
      el: this.queryByHook('refine-bar'),
      model: app.queryOptions
    });

    this.renderSubview(FieldListView, {
      el: this.queryByHook('fields-subview'),
      collection: this.schema.fields
    });

    this.renderSubview(DocumentListView, {
      el: this.queryByHook('documents-subview'),
      collection: this.schema.documents
    });
  }
});

module.exports = MongoDBCollectionView;
