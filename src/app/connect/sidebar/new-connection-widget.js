var View = require('ampersand-view');
var jade = require('jade');
var path = require('path');

var newConnectionTemplate = jade.compileFile(path.resolve(__dirname, 'new-connection-widget.jade'));

var debug = require('debug')('mongodb-compass:connect:sidebar:widget');

module.exports = View.extend({
  template: newConnectionTemplate,
  events: {
    'click a[data-hook=new-connection]': 'activate'
  },
  session: {
    active: ['boolean', true, true]
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
