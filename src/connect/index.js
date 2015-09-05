var View = require('ampersand-view');
var ConnectionCollection = require('../models/connection-collection');
var Connection = require('../models/connection');
var format = require('util').format;
var $ = require('jquery');
var app = require('ampersand-app');

// var debug = require('debug')('scout:connect:index');

require('bootstrap/js/popover');
require('bootstrap/js/tooltip');

var ConnectionView = View.extend({
  props: {
    model: Connection,
    hover: {
      type: 'boolean',
      default: false
    }
  },
  events: {
    'click a': 'onClick',
    dblclick: 'onDoubleClick',
    mouseover: 'onMouseOver',
    mouseout: 'onMouseOut',
    'click [data-hook=close]': 'onCloseClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    hover: {
      type: 'toggle',
      hook: 'close'
    }
  },
  template: require('./connection.jade'),
  onClick: function(event) {
    event.stopPropagation();
    event.preventDefault();

    // fill in the form with the clicked connection details
    this.parent.parent.displayedConnection.set(this.model.serialize());
  },
  onDoubleClick: function(event) {
    this.onClick(event);
    this.parent.parent.onSubmit(event);
  },
  onCloseClick: function(event) {
    event.stopPropagation();
    event.preventDefault();
    this.model.destroy();
  },
  onMouseOver: function() {
    this.hover = true;
  },
  onMouseOut: function() {
    this.hover = false;
  }
});


var SidebarView = View.extend({
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, ConnectionView, this.queryByHook('connection-list'));
  }
});

/**
 * @todo (imlucas) Use ampersand-form-view.
 */
var ConnectView = View.extend({
  template: require('./index.jade'),
  children: {
    displayedConnection: Connection
  },
  collections: {
    connections: ConnectionCollection
  },
  props: {
    message: {
      type: 'string',
      default: ''
    },
    has_error: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    'displayedConnection.name': {
      type: 'value',
      hook: 'name'
    },
    'displayedConnection.hostname': {
      type: 'value',
      hook: 'hostname'
    },
    'displayedConnection.port': {
      type: 'value',
      hook: 'port'
    },
    has_error: {
      hook: 'message',
      type: 'booleanClass',
      yes: 'alert-danger'
    },
    message: [
      {
        hook: 'message',
        type: 'booleanClass',
        no: 'hidden'
      },
      {
        hook: 'message'
      }
    ]
  },
  events: {
    'input [data-hook=name]': 'onNameChanged',
    'input [data-hook=port]': 'onPortChanged',
    'input [data-hook=hostname]': 'onHostNameChanged',
    'submit form': 'onSubmit'
  },
  onNameChanged: function(evt) {
    this.displayedConnection.name = evt.target.value;
  },
  onPortChanged: function(evt) {
    this.displayedConnection.portString = evt.target.value;
  },
  onHostNameChanged: function(evt) {
    this.displayedConnection.hostname = evt.target.value;
  },
  initialize: function() {
    document.title = 'Connect to MongoDB';
    this.displayedConnection.set({
      name: '',
      portString: '',
      hostname: ''
    });
    this.connections.fetch();
  },
  onSubmit: function(event) {
    event.stopPropagation();
    event.preventDefault();

    // choose default connection values if unset
    if (!this.displayedConnection.hostname) {
      this.displayedConnection.unset('hostname');
    }
    if (!this.displayedConnection.portString) {
      this.displayedConnection.unset('portString');
    }

    this.has_error = false;

    var existingConnection = this.connections.get(this.displayedConnection.uri);
    if (this.displayedConnection.name !== ''
      && existingConnection
      && existingConnection.name !== this.displayedConnection.name) {
      // the connection uri (`host:port`) exists already, but under a different name
      app.statusbar.hide();
      this.has_error = true;
      this.message = format('This connection already exists '
      + 'under the name "%s". Click "Connect" again to use this connection.',
        existingConnection.name);
      this.displayedConnection.name = existingConnection.name;
      return;
    }

    // now test if the connection name already exists with another uri
    existingConnection = this.connections.get(this.displayedConnection.name, 'name');
    if (this.displayedConnection.name !== ''
      && existingConnection
      && existingConnection.uri !== this.displayedConnection.uri) {
      // the connection name exists already, but with a different uri
      app.statusbar.hide();
      this.has_error = true;
      this.message = format('Another connection with the name "%s" already exists. Please '
      + 'choose a different name.',
        existingConnection.name);
      return;
    }

    // now test if the server is reachable
    app.statusbar.show();
    this.message = '';
    this.displayedConnection.test(this.onConnectionTested.bind(this));
  },
  onConnectionTested: function(err, model) {
    app.statusbar.hide();
    if (err) {
      this.has_error = true;
      this.message = format('Could not connect to %s, please check that a MongoDB instance '
        + 'is running there.', model.uri);
    } else {
      if (model.name !== '') {
        // only store if the user chose a name to save the connection
        model.save();
        this.connections.add(model);
      }
      window.open(format('%s?uri=%s#schema', window.location.origin, model.uri));

      setTimeout(this.set.bind(this, {
        message: ''
      }), 500);
      setTimeout(window.close, 1000);
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    // enable popovers
    $(this.query('[data-toggle="popover"]'))
      .popover({
        container: 'body',
        placement: 'top',
        trigger: 'hover'
      });
  },
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
