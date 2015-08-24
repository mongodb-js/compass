var View = require('ampersand-view');
var FormView = require('ampersand-form-view');
var InputView = require('./input-view');
var Connection = require('../models/connection');
var ConnectionCollection = require('../models/connection-collection');
var authFields = require('./auth-fields');
var sslFields = require('./ssl-fields');
var SidebarView = require('./sidebar');

var format = require('util').format;
var $ = require('jquery');
var _ = require('lodash');
var app = require('ampersand-app');

var debug = require('debug')('scout:connect:index');

require('bootstrap/js/tab');
require('bootstrap/js/popover');
require('bootstrap/js/tooltip');


/**
 * Main Connect Dialog, uses ampersand-form to render the form. By default, the authentication
 * input fields are collapsed and not active. If the user expands them, the fields are added to the
 * form and become required. If the user collapses them again, they are again removed from the form.
 *
 * The different auth mechanisms each have their own tab. The input fields for each mechanism
 * are defined in ./auth-fields.js.
 *
 */
var ConnectView = View.extend({
  template: require('./index.jade'),
  session: {
    form: 'object',
    authMethod: {
      type: 'string',
      default: null
    },
    previousAuthMethod: {
      type: 'string',
      default: null
    },
    authOpen: {
      type: 'boolean',
      default: false
    },
    sslOpen: {
      type: 'boolean',
      default: false
    },
    message: {
      type: 'string',
      default: ''
    },
    has_error: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    authLabel: {
      deps: ['authOpen'],
      fn: function() {
        return this.authOpen ? 'Disable Authentication' : 'Enable Authentication';
      }
    },
    sslLabel: {
      deps: ['sslOpen'],
      fn: function() {
        return this.sslOpen ? 'Disable SSL' : 'Enable SSL';
      }
    }
  },
  collections: {
    connections: ConnectionCollection
  },
  events: {
    'click [data-hook=openAuth]': 'onOpenAuthClicked',
    'click [data-hook=openSSL]': 'onOpenSSLClicked',
    'click [role=tab]': 'onAuthTabClicked'
  },
  bindings: {
    authOpen: [
      {
        type: 'booleanClass',
        hook: 'auth-container',
        no: 'hidden'
      },
      {
        type: 'booleanClass',
        selector: '[data-hook=openAuth] > i',
        yes: 'caret',
        no: 'caret-right'
      }
    ],
    sslOpen: [
      {
        type: 'booleanClass',
        hook: 'ssl-container',
        no: 'hidden'
      },
      {
        type: 'booleanClass',
        selector: '[data-hook=openSSL] > i',
        yes: 'caret',
        no: 'caret-right'
      }
    ],
    authLabel: {
      type: 'innerHTML',
      hook: 'open-auth-label'
    },
    sslLabel: {
      type: 'innerHTML',
      hook: 'open-ssl-label'
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
  initialize: function() {
    document.title = 'Connect to MongoDB';
    this.connections.fetch();
  },
  /**
   * Triggers when the user expands/collapses the auth section
   * @param  {Object} evt    the click event
   */
  onOpenAuthClicked: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.toggle('authOpen');
    if (this.authOpen) {
      this.authMethod = this.previousAuthMethod || 'SCRAM-SHA-1';
    } else {
      this.authMethod = null;
    }
  },
  /**
   * Triggers when the user expands/collapses the SSL section
   * @param  {Object} evt    the click event
   */
  onOpenSSLClicked: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.toggle('sslOpen');

    debug('SSL is now', this.sslOpen ? 'enabled' : 'disabled');

    if (this.sslOpen) {
      // add the SSL fields to the form and redraw them when enabled
      _.each(sslFields, function(field) {
        this.form.addField(field.render());
        this.queryByHook('ssl-container').appendChild(field.el);
      }.bind(this));
    } else {
      // remove the SSL fields from the form when disabled
      _.each(sslFields, function(field) {
        this.form.removeField(field.name);
      }.bind(this));
    }
    debug('form data now has the following fields', Object.keys(this.form.data));
  },

  /**
   * Triggers when the user switches between auth tabs
   * @param  {Object} evt    the click event
   */
  onAuthTabClicked: function(evt) {
    this.authMethod = $(evt.target).data('method');
  },

  /**
   * Triggers when the auth methods has changed (or set back to null)
   */
  onAuthMethodChange: function() {
    debug('auth method has changed from', this.previousAuthMethod, 'to', this.authMethod);

    // remove and unregister old fields
    var oldFields = authFields[this.previousAuthMethod];
    // debug('removing fields:', _.pluck(oldFields, 'name'));
    _.each(oldFields, function(field) {
      this.form.removeField(field.name);
    }.bind(this));

    // register new with form, render, append to DOM
    var newFields = authFields[this.authMethod];
    // debug('adding fields:', _.pluck(newFields, 'name'));

    _.each(newFields, function(field) {
      this.form.addField(field.render());
      this.query('#' + this.authMethod).appendChild(field.el);
    }.bind(this));

    this.previousAuthMethod = this.authMethod;
    debug('form data now has the following fields', Object.keys(this.form.data));
  },

  /**
   * checks if the connection already exists under a different name. Returns null if the
   * connection doesn't exist yet, or the name of the connection, if it does.
   *
   * @param  {Object} connection      The new connection to check
   * @return {String|null}            Name of the connection that is otherwise identical to obj
   */
  checkExistingConnection: function(connection) {
    var existingConnection = this.connections.get(connection.uri);

    if (connection.name !== ''
      && existingConnection
      && connection.name !== existingConnection.name) {
      app.statusbar.hide();
      this.has_error = true;
      this.message = format('This connection already exists under the name "%s". '
      + 'Click "Connect" again to use that connection.',
        existingConnection.name);
      return existingConnection.name;
    }
    return null;
  },

  /**
   * checks if the connection name already exists but with different details. Returns true
   * if the name already exists, or false otherwise.
   *
   * @param  {Object} connection      The new connection to check
   * @return {Boolean}                Whether or not the connection name already exists
   */
  checkExistingName: function(connection) {
    var existingConnection = this.connections.get(connection.name, 'name');

    if (connection.name !== ''
      && existingConnection
      && existingConnection.uri !== connection.uri) {
      app.statusbar.hide();
      this.has_error = true;
      this.message = format('Another connection with the name "%s" already exists. Please '
      + 'delete the existing connection first or choose a different name.',
        existingConnection.name);
      return true;
    }
    return false;
  },

  render: function() {
    this.renderWithTemplate();

    var connectView = this;

    // The form wrapper class
    this.form = new FormView({
      autoRender: true,
      autoAppend: false,
      el: connectView.queryByHook('connect-form'),
      /**
       * callback when user hits submit (or presses enter). Run some general checks here
       * (connection works, etc) and set general error message at the top, or open the connection.
       *
       * @param {Object} obj     contains the clean()'ed up data from the form.
       */
      submitCallback: function(obj) {
        debug('form submitted with data:', obj);

        // @todo make this and ConnectionCollection work with mongodb-connection-model instead
        var connection = new Connection({
          name: obj.name,
          hostname: obj.hostname,
          portString: '' + obj.port
        });

        var existingName = connectView.checkExistingConnection(connection);
        if (existingName) {
          this.valid = false;
          this.setValue('name', existingName);
          return;
        }

        existingName = connectView.checkExistingName(connection);
        if (existingName) {
          this.valid = false;
          return;
        }

        // @todo do connection test here
        app.statusbar.show();
        connection.test(function(err, conn) {
          app.statusbar.hide();
          if (err) {
            // @todo handle error
            return;
          }

          // save connection if a name was provided
          if (conn.name !== '') {
            conn.save();
            connectView.connections.add(conn);
          }

          // connect
          debug('all good, connecting:', conn.serialize());
          // window.open(format('%s?uri=%s#schema', window.location.origin, connection.uri));
          // setTimeout(connectView.set.bind(connectView, {
          //   message: ''
          // }), 500);
          // setTimeout(window.close, 1000);
        });
      },
      clean: function(obj) {
        // clean up the form values here, e.g. conversion to numbers etc.

        // get auth mechanism from parent view
        obj.auth_mechanism = this.parent.authMethod;

        // is SSL enabled (options are open)
        obj.ssl = this.parent.sslOpen;

        // fill in all default fields
        obj.hostname = obj.hostname || 'localhost';
        obj.port = obj.port || 27017;

        // port number must be numeric
        obj.port = Number(obj.port);

        if (obj.auth_mechanism) {
          // default fields for auth
          obj.authdb = obj.authdb || 'admin';
        }

        return obj;
      },
      /**
       * These are the default form fields that are always present in the connect dialog. Auth and
       * SSL fields are added/removed dynamically, depending on whether the options are expanded or
       * collapsed.
       */
      fields: [
        // hostname field
        new InputView({
          template: require('./input-default.jade'),
          el: connectView.queryByHook('hostname-subview'),
          name: 'hostname',
          label: 'Hostname',
          placeholder: 'localhost',
          required: false
        }),
        // port number field
        new InputView({
          template: require('./input-default.jade'),
          el: connectView.queryByHook('port-subview'),
          name: 'port',
          label: 'Port',
          placeholder: '27017',
          required: false,
          tests: [function(value) {
            if (isNaN(value)) {
              debug('checking for number');
              return 'port must be a number.';
            }
          }, function(value) {
            if (parseInt(value, 10) < 0) {
              return 'port number must be positive.';
            }
          }
          ]
        }),
        // connection name field
        new InputView({
          template: require('./input-saveas.jade'),
          el: this.queryByHook('saveas-subview'),
          name: 'name',
          placeholder: 'Connection Name',
          required: false
        })
      ]
    });

    this.registerSubview(this.form);
    this.listenToAndRun(this, 'change:authMethod', this.onAuthMethodChange.bind(this));

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
