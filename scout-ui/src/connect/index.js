var View = require('ampersand-view');

var ConnectionCollection = require('../models/connection-collection');
var Connection = require('../models/connection');

var ConnectionView = View.extend({
  props: {
    model: Connection
  },
  bindings: {
    'model.name': {
      hook: 'name'
    }
  },
  template: '<a class="list-group-item" data-hook="name"></a>'
});

var SidebarView = View.extend({
  template: require('./sidebar.jade'),
  render: function(){
    this.renderWithTemplate();
    this.renderCollection(this.collection, ConnectionView, this.queryByHook('connection-list'));
  }
});

/**
 * @todo (imlucas) Use ampersand-form-view.
 */
var ConnectView = View.extend({
  collections: {
    connections: ConnectionCollection
  },
  template: require('./index.jade'),
  subviews: {
    sidebar: {
      waitFor: 'connections',
      hook: 'sidebar-subview',
      prepareView: function(el) {
        return new SidebarView({
            el: el,
            parent: this,
            collection: this.connections
          });
      }
    }
  }
});
module.exports = ConnectView;
