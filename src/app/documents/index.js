var View = require('ampersand-view');
var DocumentListView = require('./document-list.js');
var Action = require('hadron-action');
// var SamplingMessageView = require('../sampling-message');

// var debug = require('debug')('mongodb-compass:home:documents');

var indexTemplate = require('./index.jade');

var DocumentView = View.extend({
  template: indexTemplate,
  props: {
    visible: {
      type: 'boolean',
      default: false
    },
    hasRefineBar: ['boolean', true, true]
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  initialize: function() {
    this.listenTo(this.parent, 'submit:query', this.onQueryChanged.bind(this));
    this.on('change:visible', this.onVisibleChanged.bind(this));
  },
  render: function() {
    this.renderWithTemplate(this);
    this.documents.loadDocuments();
    Action.filterChanged(app.queryOptions.query.serialize());
    return this;
  },
  onVisibleChanged: function() {
    if (this.visible) {
      this.parent.refineBarView.visible = this.hasRefineBar;
    }
  },
  onQueryChanged: function() {
    this.documents.reset();
    this.documents.loadDocuments();
    Action.filterChanged(app.queryOptions.query.serialize());
  },
  subviews: {
    documents: {
      hook: 'documents-subview',
      prepareView: function(el) {
        return new DocumentListView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    }
    // @todo thomasr need to show the query count below the refine bar

    // sampling_message: {
    //   hook: 'sampling-message-subview',
    //   prepareView: function(el) {
    //     return new SamplingMessageView({
    //       el: el,
    //       parent: this
    //     });
    //   }
    // }
  }
});

module.exports = DocumentView;
