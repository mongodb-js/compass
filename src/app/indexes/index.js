var View = require('ampersand-view');

var indexTemplate = require('../templates').indexes.index;
var indexItemTemplate = require('../templates').indexes['index-item'];

var IndexItemView = View.extend({
  template: indexItemTemplate,
  render: function() {
    this.renderWithTemplate(this);
  }
});

module.exports = View.extend({
  template: indexTemplate,
  props: {
    // indexJSON: {
    //   type: 'string',
    //   default: ''
    // }
  },
  // bindings: {
  //   indexJSON: {
  //     hook: 'indexes'
  //   }
  // },
  initialize: function() {
    // this.listenTo(this.model, 'sync', this.onModelSynced.bind(this));
  },
  // onModelSynced: function() {
  //   this.indexJSON = JSON.stringify(this.model.indexes.serialize(), null, ' ');
  // },
  render: function() {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.indexes, IndexItemView,
      this.queryByHook('indexes'));
  }
});
