var app = require('ampersand-app');
var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-list');
var RefineBarView = require('../refine-view');
var MongoDBCollection = require('../models/mongodb-collection');
var pluralize = require('pluralize');
var format = require('util').format;
var FastView = require('../fast-view');
var _ = require('lodash');

var MongoDBCollectionView = View.extend(FastView, {
  template: require('./collection.jade'),
  props: {
    sidebar_open: {
      type: 'boolean',
      default: false
    },
    schema_sample_size: {
      type: 'number',
      default: 0
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
    sample_size_message: {
      hook: 'sample_size_message'
    },
    is_sample: {
      hook: 'is_sample',
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  derived: {
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
  children: {
    model: MongoDBCollection
  },
  initialize: function() {
    app.statusbar.watch(this, app.schema);
    app.schema.reset();
    app.schema.ns = this.model.getId();
    this.listenTo(app.queryOptions, 'change', this.onQueryChanged);
    this.fetch(this.model);
    this.fetch(app.schema, {
      message: 'Analyzing documents...'
    });

    this.listenTo(app.schema, 'change:sample_size', _.debounce(function() {
      this.schema_sample_size = app.schema.sample_size;
    }.bind(this), 100));
  },
  onQueryChanged: function() {
    app.schema.refine(app.queryOptions.serialize(), {
      message: 'Analyzing documents...'
    });
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

    app.schema.on('sync', function() {
      this.renderSubview(FieldListView, {
        el: this.queryByHook('fields-subview'),
        collection: app.schema.fields
      });
    }.bind(this));

    this.renderSubview(DocumentListView, {
      el: this.queryByHook('documents-subview'),
      collection: app.schema.documents
    });
  }
});

module.exports = MongoDBCollectionView;
