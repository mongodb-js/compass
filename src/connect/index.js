var View = require('ampersand-view');
var SidebarView = require('./sidebar');
var ConnectionCollection = require('../models/connection-collection');

var ConnectView = View.extend({
  props: {
    isReady: 'boolean'
  },
  collections: {
    connections: ConnectionCollection
  },
  template: require('./static-connect.jade'),
  initialize: function() {
    this.connections.fetch();
  },
  subviews: {
    sidebar: {
      hook: 'sidebar-subview',
      waitFor: 'connections',
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
