var models = require('../models');
var app = require('ampersand-app');
var AmpersandView = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-view');
var $ = require('jquery');
var debug = require('debug')('scout-ui:home:collection');


module.exports = AmpersandView.extend({
  template: require('./collection.jade'),
  props: {
    sidebarWidth: {
      type: 'number',
      default: 350
    }
  },
  bindings: {
    'model._id': {
      hook: 'name'
    },
    'sidebarWidth': [
      {
        type: function(el, value) {
          debug('main: current width is', $(el).width());
        },
        hook: 'main-container'
      },
      {
        type: function(el, value) {
          debug('sidebar: changed width to', value);
          $(el).width(value);
        },
        hook: 'side-container'
      }
    ]
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
