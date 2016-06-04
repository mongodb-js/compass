var View = require('ampersand-view');
var app = require('ampersand-app');

var React = require('react');
var ReactDOM = require('react-dom');

// var debug = require('debug')('mongodb-compass:schema');

var SchemaView = View.extend({
  template: require('./index.jade'),
  props: {
    loading: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    loading: {
      type: 'toggle',
      hook: 'loading'
    }
  },
  initialize: function() {
    this.schemaView = app.componentRegistry.findByRole('Collection:Schema')[0];
  },
  render: function() {
    this.renderWithTemplate();
    ReactDOM.render(React.createElement(this.schemaView), this.queryByHook('fields-subview'));
  },
  remove: function() {
    View.prototype.remove.call(this);
  }
});

module.exports = SchemaView;

// var View = require('ampersand-view');
// var FieldListView = require('./field-list.js');
// var SampledSchema = require('../models/sampled-schema');
// var SamplingMessageView = require('../sampling-message');
// var app = require('ampersand-app');
// var electron = require('electron');
// var remote = electron.remote;
// var dialog = remote.dialog;
// var BrowserWindow = remote.BrowserWindow;
// var clipboard = remote.clipboard;
// var format = require('util').format;
// var metrics = require('mongodb-js-metrics')();
// var ipc = require('hadron-ipc');
//
// var debug = require('debug')('mongodb-compass:schema:index');
//
// var indexTemplate = require('./index.jade');
//
// var SchemaView = View.extend({
//   // modelType: 'Collection',
//   template: indexTemplate,
//   props: {
//     visible: {
//       type: 'boolean',
//       default: false
//     },
//     sampling: {
//       type: 'boolean',
//       default: false
//     },
//     hasRefineBar: ['boolean', true, true]
//   },
//   derived: {
//     is_empty: {
//       deps: ['schema.sample_size', 'schema.is_fetching'],
//       fn: function() {
//         return this.schema.sample_size === 0 && !this.schema.is_fetching;
//       }
//     }
//   },
//   events: {
//     'click .splitter': 'onSplitterClick'
//   },
//   bindings: {
//     visible: {
//       type: 'booleanClass',
//       no: 'hidden'
//     },
//     is_empty: [
//       {
//         hook: 'empty',
//         type: 'booleanClass',
//         no: 'hidden'
//       },
//       {
//         hook: 'column-container',
//         type: 'booleanClass',
//         yes: 'hidden'
//       }
//     ]
//   },
//   children: {
//     schema: SampledSchema
//   },
//   initialize: function() {
//     this.listenTo(this.schema, 'sync error', this.schemaIsSynced.bind(this));
//     this.listenTo(this.schema, 'request', this.schemaIsRequested.bind(this));
//     this.listenTo(this.model, 'sync', this.onCollectionFetched.bind(this));
//     this.listenTo(this.parent, 'submit:query', this.onQueryChanged.bind(this));
//     this.on('change:visible', this.onVisibleChanged.bind(this));
//
//     ipc.on('window:menu-share-schema-json', this.onShareSchema.bind(this));
//   },
//   render: function() {
//     this.renderWithTemplate(this);
//   },
//   schemaIsSynced: function() {
//     // only listen to share menu events if we have a sync'ed schema
//     this.sampling = false;
//     ipc.call('window:show-share-submenu');
//   },
//   schemaIsRequested: function() {
//     ipc.call('window:hide-share-submenu');
//     this.sampling = true;
//   },
//   onVisibleChanged: function() {
//     if (this.visible) {
//       this.parent.refineBarView.visible = this.hasRefineBar;
//     }
//     if (this.visible && this.sampling) {
//       app.statusbar.visible = true;
//     } else {
//       app.statusbar.visible = false;
//     }
//   },
//   onShareSchema: function() {
//     clipboard.writeText(JSON.stringify(this.schema.serialize(), null, '  '));
//
//     var detail = format('The schema definition of %s has been copied to your '
//       + 'clipboard in JSON format.', this.model._id);
//
//     dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
//       type: 'info',
//       message: 'Share Schema',
//       detail: detail,
//       buttons: ['OK']
//     });
//
//     metrics.track('Share Schema', 'used');
//   },
//   onCollectionFetched: function() {
//     debug('collection fetched in schema');
//     // track collection information
//
//     // @todo thomasr fix this, maybe this.model._id ?
//     // if (!ns) {
//     //   this.visible = false;
//     //   debug('No active collection namespace so no schema has been requested yet.');
//     //   return;
//     // }
//
//     // this.visible = true;
//     app.queryOptions.reset();
//     app.volatileQueryOptions.reset();
//
//     this.schema.ns = this.model._id;
//     this.schema.reset();
//     var options = app.volatileQueryOptions.serialize();
//     if (this.visible) {
//       app.statusbar.visible = true;
//     }
//     this.schema.fetch(options);
//   },
//   onQueryChanged: function() {
//     var options = app.queryOptions.serialize();
//     if (this.visible) {
//       app.statusbar.visible = true;
//     }
//     this.schema.refine(options);
//   },
//   subviews: {
//     sampling_message: {
//       hook: 'sampling-message-subview',
//       prepareView: function(el) {
//         return new SamplingMessageView({
//           el: el,
//           parent: this,
//           model: this.schema
//         });
//       }
//     },
//     fields: {
//       hook: 'fields-subview',
//       prepareView: function(el) {
//         return new FieldListView({
//           el: el,
//           parent: this,
//           collection: this.schema.fields
//         });
//       }
//     }
//   }
// });
//
// module.exports = SchemaView;
