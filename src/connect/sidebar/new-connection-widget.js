var View = require('ampersand-view');

var debug = require('debug')('mongodb-compass:connect:sidebar:widget');

module.exports = View.extend({
  template: require('./new-connection-widget.jade'),
  events: {
    'click a[data-hook=new-connection]': 'activate'
  },
  session: {
    active: ['boolean', true, false]
  },
  bindings: {
    active: {
      type: 'booleanClass',
      hook: 'activatable',
      name: 'active'
    }
  },
  initialize: function() {
    this.parent.on('existing-connection', this.deactivate.bind(this));
  },
  deactivate: function() {
    debug('deactivating!');
    this.active = false;
  },
  activate: function(evt) {
    this.parent.trigger('new-connection', evt);
    this.active = true;
  }
});
