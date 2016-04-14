var View = require('ampersand-view');
var FieldListView = require('../field-list');
var SampledSchema = require('../models/sampled-schema');
var SamplingMessageView = require('../sampling-message');
var app = require('ampersand-app');
var _ = require('lodash');
var electron = require('electron');
var remote = electron.remote;
var dialog = remote.dialog;
var BrowserWindow = remote.BrowserWindow;
var clipboard = remote.clipboard;
var format = require('util').format;
var metrics = require('mongodb-js-metrics')();

var debug = require('debug')('mongodb-compass:home:schema');

var collectionTemplate = require('../templates').home.schema;

var SchemaView = View.extend({
  // modelType: 'Collection',
  template: collectionTemplate,
  props: {
    visible: {
      type: 'boolean',
      default: false
    },
    hasRefineBar: ['boolean', true, true]
  },
  derived: {
    is_empty: {
      deps: ['schema.sample_size', 'schema.is_fetching'],
      fn: function() {
        return this.schema.sample_size === 0 && !this.schema.is_fetching;
      }
    }
  },
  events: {
    'click .splitter': 'onSplitterClick'
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    is_empty: [
      {
        hook: 'empty',
        type: 'booleanClass',
        no: 'hidden'
      },
      {
        hook: 'column-container',
        type: 'booleanClass',
        yes: 'hidden'
      }
    ]
  },
  children: {
    schema: SampledSchema
  },
  initialize: function() {
    this.listenTo(this.schema, 'sync', this.schemaIsSynced.bind(this));
    this.listenTo(this.schema, 'request', this.schemaIsRequested.bind(this));
    this.listenTo(this.model, 'sync', this.onCollectionFetched.bind(this));
    this.listenTo(this.parent, 'submit:query', this.onQueryChanged.bind(this));
    this.on('change:visible', this.onVisibleChanged.bind(this));
  },
  render: function() {
    this.renderWithTemplate(this);
  },
  schemaIsSynced: function() {
    // only listen to share menu events if we have a sync'ed schema
    this.listenTo(app, 'menu-share-schema-json', this.onShareSchema.bind(this));
    app.sendMessage('show share submenu');
  },
  schemaIsRequested: function() {
    app.sendMessage('hide share submenu');
    this.stopListening(app, 'menu-share-schema-json');
  },
  onVisibleChanged: function() {
    if (this.visible) {
      this.parent.refineBarView.visible = this.hasRefineBar;
    }
  },
  onShareSchema: function() {
    clipboard.writeText(JSON.stringify(this.schema.serialize(), null, '  '));

    var detail = format('The schema definition of %s has been copied to your '
      + 'clipboard in JSON format.', this.model._id);

    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
      type: 'info',
      message: 'Share Schema',
      detail: detail,
      buttons: ['OK']
    });

    metrics.track('Share Schema', 'used');
  },
  onCollectionFetched: function(model) {
    debug('collection fetched in schema');
    // track collection information

    // @todo thomasr fix this, maybe this.model._id ?
    // if (!ns) {
    //   this.visible = false;
    //   debug('No active collection namespace so no schema has been requested yet.');
    //   return;
    // }

    // this.visible = true;
    app.queryOptions.reset();
    app.volatileQueryOptions.reset();

    this.schema.ns = this.model._id;
    this.schema.reset();
    this.schema.fetch(_.assign({}, app.volatileQueryOptions.serialize(), {
      message: 'Analyzing documents...'
    }));

    var metadata = _.omit(model.serialize(), ['_id', 'database',
      'index_details', 'wired_tiger']);
    metadata.specialish = model.specialish;
    metadata['database name length'] = model.database.length;
    metadata['collection name length'] = model.getId().length -
      model.database.length - 1;
    metrics.track('Collection', 'fetched', metadata);
  },
  onQueryChanged: function() {
    var options = app.queryOptions.serialize();
    options.message = 'Analyzing documents...';
    this.schema.refine(options);
  },
  subviews: {
    sampling_message: {
      hook: 'sampling-message-subview',
      prepareView: function(el) {
        return new SamplingMessageView({
          el: el,
          parent: this,
          model: this.schema
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
    }
  }
});

module.exports = SchemaView;
