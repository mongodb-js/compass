var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-list');
var RefineBarView = require('../refine-view');
var MongoDBCollection = require('../models/mongodb-collection');
var SampledSchema = require('../models/sampled-schema');
var app = require('ampersand-app');
var _ = require('lodash');
// var ms = require('ms');
var electron = require('electron');
var remote = electron.remote;
var dialog = remote.dialog;
var BrowserWindow = remote.BrowserWindow;
var clipboard = remote.clipboard;
var format = require('util').format;
var metrics = require('mongodb-js-metrics')();
var debug = require('debug')('mongodb-compass:home:collection');
var jade = require('jade');
var path = require('path');

var collectionTemplate = jade.compileFile(path.resolve(__dirname, 'collection.jade'));

var MongoDBCollectionView = View.extend({
  // modelType: 'Collection',
  template: collectionTemplate,
  props: {
    sidebar_open: {
      type: 'boolean',
      default: false
    },
    schema_synched: {
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
    'model._id': {
      hook: 'name'
    },
    sidebar_open: {
      type: 'booleanClass',
      yes: 'sidebar-open',
      hook: 'column-container'
    },
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
    this.model = new MongoDBCollection();
    this.on('change:sidebar_open', function(payload, newValue) {
      if (newValue) {
        // When sidebar_open changes to true, load documents.
        this.documents.loadDocuments();
      } else {
        // When sidebar_open changes to false, dump all loaded documents.
        this.documents.reset();
      }
    });
    this.listenTo(this.schema, 'sync', this.schemaIsSynced.bind(this));
    this.listenTo(this.schema, 'request', this.schemaIsRequested.bind(this));
    this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  render: function() {
    this.renderWithTemplate(this);
    var sidebar = this.query('.side');
    sidebar.addEventListener('scroll', function() {
      // If the sidebar is open, and our schema is ready...
      if (this.schema_synched && this.sidebar_open) {
        // call the scroll method on the document subview.
        // It also needs to be passed the containing element.
        this.documents.onViewerScroll(sidebar);
      }
    }.bind(this));
    return this;
  },
  schemaIsSynced: function() {
    // only listen to share menu events if we have a sync'ed schema
    this.schema_synched = true;
    this.listenTo(app, 'menu-share-schema-json', this.onShareSchema.bind(this));
    app.sendMessage('show share submenu');
    if (this.sidebar_open) {
      this.documents.loadDocuments();
    }
  },
  schemaIsRequested: function() {
    this.schema_synched = false;
    app.sendMessage('hide share submenu');
    this.stopListening(app, 'menu-share-schema-json');
    if (this.sidebar_open && this.documents) {
      this.documents.reset();
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
  onCollectionChanged: function() {
    var ns = this.parent.ns;
    if (!ns) {
      this.visible = false;
      debug('No active collection namespace so no schema has been requested yet.');
      return;
    }
    this.visible = true;
    app.queryOptions.reset();
    app.volatileQueryOptions.reset();

    this.schema.ns = this.model._id = ns;
    debug('updating namespace to `%s`', ns);
    this.schema.reset();
    this.schema.fetch(_.assign({}, app.volatileQueryOptions.serialize(), {
      message: 'Analyzing documents...'
    }));
    this.model.once('sync', this.onCollectionFetched.bind(this));
    this.model.fetch();
  },
  onCollectionFetched: function(model) {
    // track collection information
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
  /**
   * handler for opening the document viewer sidebar.
   */
  onSplitterClick: function() {
    this.toggle('sidebar_open');
    metrics.track('Document Viewer', 'used', {
      opened: this.sidebar_open
    });
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
        var refineBarView = new RefineBarView({
          el: el,
          parent: this,
          queryOptions: app.queryOptions,
          volatileQueryOptions: app.volatileQueryOptions
        });
        this.listenTo(refineBarView, 'submit', this.onQueryChanged);
        return refineBarView;
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
          parent: this
        });
      }
    }
  }
});

module.exports = MongoDBCollectionView;
