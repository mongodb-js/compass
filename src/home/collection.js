var app = require('ampersand-app');
var AmpersandView = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-view');
var RefineBarView = require('../refine-view');
var MongoDBCollection = require('../models/mongodb-collection');
var SampledSchema = require('../models/sampled-schema');
var pluralize = require('pluralize');
var format = require('util').format;

module.exports = AmpersandView.extend({
  namespace: 'Collection',
  template: require('./collection.jade'),
  props: {
    open: {
      type: 'boolean',
      default: false
    },
    fieldListView: {
      type: 'view'
    }
  },
  events: {
    'click .splitter': 'onSplitterClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    open: {
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
    this.schema.fetch();

    this.model.fetch();

    this.listenTo(app.queryOptions, 'change', this.onQueryChanged);
  },
  onQueryChanged: function() {
    this.schema.refine(app.queryOptions.serialize());
  },
  onSplitterClick: function() {
    this.toggle('open');
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
    fields: {
      waitFor: 'schema.fields',
      hook: 'fields-subview',
      prepareView: function(el) {
        this.fieldListView = new FieldListView({
          el: el,
          parent: this,
          collection: this.schema.fields
        });
        return this.fieldListView;
      }
    },
    refinebar: {
      hook: 'refine-bar',
      prepareView: function(el) {
        return new RefineBarView({
          el: el,
          parent: this,
          model: app.queryOptions
        });
      }
    },
    documents: {
      waitFor: 'open',
      hook: 'documents-subview',
      prepareView: function(el) {
        return new DocumentListView({
          el: el,
          parent: this,
          collection: this.model.documents
        });
      }
    }
  }
});
