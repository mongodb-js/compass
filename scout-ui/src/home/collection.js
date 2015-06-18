var models = require('../models');
var app = require('ampersand-app');
var AmpersandView = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-view');
var RefineBarView = require('../refine-view');

var debug = require('debug')('scout-ui:home:collection');
var $ = require('jquery');

module.exports = AmpersandView.extend({
  template: require('./collection.jade'),
  props: {
    open: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    sidebarWidth: {
      deps: ['open'],
      fn: function() {
        return this.open ? 400 : 0;
      }
    }
  },
  events: {
    'click .splitter': 'onSplitterClick',
  },
  bindings: {
    'model._id': {
      hook: 'name'
    },
    'sidebarWidth': {
      type: function(el, value) {
        $(el).width(value);
      },
      selector: '.side'
    }
  },
  children: {
    model: models.Collection,
    schema: models.SampledSchema
  },
  initialize: function() {
    app.statusbar.watch(this, this.schema);

    this.schema.ns = this.model._id;
    this.listenTo(this.schema, 'error', this.onError);

    this.schema.fetch();
    this.model.fetch();

    this.listenTo(app.queryOptions, 'change', this.onQueryChanged);
  },
  onQueryChanged: function() {
    schema.fetch(app.queryOptions.serialize());
  },
  onSplitterClick: function() {
    this.toggle('open');
  },
  onError: function(schema, err) {
    // @todo: Figure out a good way to handle this (server is probably crashed).
    console.error('Error getting schema: ', err);
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
        return new FieldListView({
            el: el,
            parent: this,
            collection: this.schema.fields
          });
      }
    },
    fields: {
      hook: 'refine-bar',
      prepareView: function(el) {
        return new RefineBarView({
            el: el,
            parent: this
          });
      }
    },
    documents: {
      waitFor: 'model.documents',
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
