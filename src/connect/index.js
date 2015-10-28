var View = require('ampersand-view');
var SidebarView = require('./sidebar');
var ConnectionCollection = require('../models/connection-collection');
var ConnectFormView = require('./connect-form-view');
var Connection = require('../models/connection');
var debug = require('debug')('scout:connect:index');
var _ = require('lodash');
var app = require('ampersand-app');
var format = require('util').format;

/**
 * AuthenticationOptionCollection
 */
var authMethods = require('./authentication');

/**
 * SslOptionCollection
 */
var sslMethods = require('./ssl');


var ConnectView = View.extend({
  template: require('./static-connect.jade'),
  props: {
    form: 'object',
    message: {
      type: 'string',
      default: ''
    },
    connectionName: {
      type: 'string',
      default: ''
    },
    isFavorite: {
      type: 'boolean',
      default: false
    },
    authMethod: {
      type: 'string',
      default: 'MONGODB'
    },
    previousAuthMethod: {
      type: 'string',
      default: null
    },
    sslMethod: {
      type: 'string',
      default: 'NONE'
    },
    previousSslMethod: {
      type: 'string',
      default: null
    }
  },
  derived: {
    hasError: {
      deps: ['message'],
      fn: function() {
        return this.message !== '';
      }
    }
  },
  collections: {
    connections: ConnectionCollection
  },
  events: {
    'change select[name=authentication]': 'onAuthMethodChanged',
    'change select[name=ssl]': 'onSslMethodChanged',
    'click [data-hook=create-favorite-button]': 'onCreateFavoriteClicked',
    'click [data-hook=remove-favorite-button]': 'onRemoveFavoriteClicked',
    'input input[name=name]': 'onNameInputChanged',
    'change input[name=name]': 'onNameInputChanged'
  },
  bindings: {
    // show error div
    hasError: {
      type: 'toggle',
      hook: 'message-div',
      mode: 'visibility'
    },
    // show message in error div
    message: {
      hook: 'message'
    },
    isFavorite: {
      type: 'toggle',
      yes: '[data-hook=remove-favorite-button]',
      no: '[data-hook=create-favorite-button]'
    },
    connectionName: [
      {
        type: 'toggle',
        hook: 'favorite-buttons'
      },
      {
        type: 'toggle',
        hook: 'save-changes-button'
      }
    ]
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
  },
  initialize: function() {
    document.title = 'Connect to MongoDB';
    this.connections.on('sync', this.updateConflictingNames.bind(this));
    this.connections.fetch();
  },
  render: function() {
    this.renderWithTemplate({
      authMethods: authMethods.serialize(),
      sslMethods: sslMethods.serialize()
    });

    this.form = new ConnectFormView({
      parent: this,
      el: this.queryByHook('connect-form'),
      autoRender: true,
      autoAppend: false
    });

    this.registerSubview(this.form);
    this.listenToAndRun(this, 'change:authMethod', this.replaceAuthMethodFields.bind(this));
    this.listenToAndRun(this, 'change:sslMethod', this.replaceSslMethodFields.bind(this));
  },
  /**
   * called when user switches select input to another authentication method
   *
   * @param {Object} evt   onchange event
   */
  onAuthMethodChanged: function(evt) {
    this.authMethod = evt.target.value;
  },
  /**
   * called when user switches select input to another SSL method
   *
   * @param {Object} evt   onchange event
   */
  onSslMethodChanged: function(evt) {
    this.sslMethod = evt.target.value;
  },
  /**
   * called when this.authMethod changes. Replaces the fields in `this.form`.
   */
  replaceAuthMethodFields: function() {
    // remove and unregister old fields
    var oldFields = _.get(authMethods.get(this.previousAuthMethod), 'fields', []);
    _.each(oldFields, function(field) {
      this.form.removeField(field.name);
    }.bind(this));

    // register new with form, render, append to DOM
    var newFields = authMethods.get(this.authMethod).fields;
    _.each(newFields, function(field) {
      this.form.addField(field.render());
      this.query('#auth-' + this.authMethod).appendChild(field.el);
    }.bind(this));

    this.previousAuthMethod = this.authMethod;
    debug('auth form data now has the following fields', Object.keys(this.form.data));
  },
  /**
   * called when this.sslMethod changes. Replaces the fields in `this.form`.
   */
  replaceSslMethodFields: function() {
    // remove and unregister old fields
    var oldFields = _.get(sslMethods.get(this.previousSslMethod), 'fields', []);
    _.each(oldFields, function(field) {
      this.form.removeField(field.name);
    }.bind(this));

    // register new with form, render, append to DOM
    var newFields = sslMethods.get(this.sslMethod).fields;
    _.each(newFields, function(field) {
      this.form.addField(field.render());
      this.query('#ssl-' + this.sslMethod).appendChild(field.el);
    }.bind(this));

    this.previousSslMethod = this.sslMethod;
    debug('ssl form data now has the following fields', Object.keys(this.form.data));
  },
  /**
   * Return to a clean state between form submissions.
   *
   * @api private
   */
  reset: function() {
    this.message = '';
  },
  /**
   * Use a connection to view schemas, such as after submitting a form or when double-clicking on
   * a list item like in `./sidebar`.
   *
   * @param {Connection} connection
   * @api public
   */
  connect: function(connection) {
    app.statusbar.show();

    debug('testing credentials are usable...');
    connection.test(function(err) {
      app.statusbar.hide();
      if (!err) {
        this.onConnectionSuccessful(connection);
        return;
      }

      debug('failed to connect', err);

      this.onError(err, connection);
      return;
    }.bind(this));
  },
  createNewConnection: function() {
    this.reset();
    this.isFavorite = false;
    this.connectionName = '';
    this.authMethod = 'MONGODB';
    this.form.connection_id = '';
    this.form.reset();
    this.updateConflictingNames();
  },
  /**
   * If there is a validation or connection error show a nice message.
   *
   * @param {Error} err
   * @param {Connection} connection
   * @api private
   */
  onError: function(err, connection) {
    // @todo (imlucas): `metrics.trackEvent('connect error', authentication + ssl boolean)`
    debug('showing error message', {
      err: err,
      model: connection
    });
    this.message = err.message;
  },
  onConnectionSuccessful: function(connection) {
    app.statusbar.hide();
    // this.form.connection_id = '';

    // if a connection with same name already exists, get that instead
    connection = this.connections.get(connection.name, 'name') || connection;
    connection.last_used = new Date();
    connection.save();
    /**
     * @todo (imlucas): So we can see what auth mechanisms
     * and accoutrement people are actually using IRL.
     *
     *   metrics.trackEvent('connect success', {
     *     authentication: model.authentication,
     *     ssl: model.ssl
     *   });
     */
    this.connections.add(connection, {
      merge: true
    });
    // update sidebar view, it may have changed
    this.sidebar.render();

    debug('opening schema view for', connection.serialize());
    /**
     * @see ./src/app.js `params.connection_id`
     */
    window.open(format('%s?connection_id=%s#schema', window.location.origin, connection.getId()));
    setTimeout(this.set.bind(this, {
      message: ''
    }), 500);

    setTimeout(window.close, 1000);
  },
  /**
   * Update the form's state based on an existing connection, e.g. clicking on a list item
   * like in `./sidebar.js`.
   *
   * @param {Connection} connection
   * @api public
   */
  onConnectionSelected: function(connection) {
    // If the new model has auth, expand the auth settings container and select the correct tab.
    this.authMethod = connection.authentication;
    this.sslMethod = connection.ssl;
    this.isFavorite = connection.is_favorite;

    // Changing `this.authMethod` and `this.sslMethod` dynamically updates the form fields
    // so we need to get a list of what keys are currently available to set.
    var keys = ['name', 'port', 'hostname', 'authentication', 'ssl'];
    if (connection.authentication !== 'NONE') {
      keys.push.apply(keys, _.pluck(authMethods.get(this.authMethod).fields, 'name'));
    }
    if (connection.ssl !== 'NONE') {
      keys.push.apply(keys, _.pluck(sslMethods.get(this.sslMethod).fields, 'name'));
    }

    var values = _.pick(connection, keys);
    this.form.connection_id = connection.getId();
    this.updateConflictingNames();

    // make connection active, and (implicitly) all others inactive
    connection.active = true;
    debug('connection is active now?', connection.active);

    // Populates the form from values in the model.
    this.form.setValues(values);
    this.connectionName = this.form.data.name;
  },
  onCreateFavoriteClicked: function() {
    var connection = null;
    if (this.form.connection_id) {
      connection = this.connections.get(this.form.connection_id);
    }
    if (!connection) {
      connection = new Connection(this.form.data);
    }
    _.assign(connection, this.form.data);

    if (!connection.isValid()) {
      this.onError(connection.validationError);
      return;
    }

    connection.is_favorite = true;
    this.isFavorite = true;

    connection.save();
    this.connections.add(connection, {
      merge: true
    });
    this.form.connection_id = connection.getId();
    this.updateConflictingNames();
  },
  onRemoveFavoriteClicked: function() {
    debug('remove favorite clicked');
    var connection = this.connections.get(this.form.connection_id);
    if (!connection) {
      debug('favorite connection to be removed doesn\'t exist. this should not happen!');
      return;
    }
    connection.is_favorite = false;
    connection.save();
    this.createNewConnection();
    this.updateConflictingNames();
  },
  updateConflictingNames: function() {
    var conflicts = this.connections.filter(function(model) {
      debug('inside', model.getId(), this.form.connection_id);
      return model.is_favorite && model.getId() !== _.get(this.form, 'connection_id');
    }.bind(this));
    debug('favorites (excluding self)', _.pluck(conflicts, 'name'));
    var nameField = this.form.getField('name');
    nameField.conflicting = _.pluck(conflicts, 'name');
  },
  onSaveChangesClicked: function() {
    debug('save changes clicked');
  },
  onFormSubmitted: function(connection) {
    this.reset();
    if (!connection.isValid()) {
      this.onError(connection.validationError);
      return;
    }
    this.connect(connection);
  },
  onNameInputChanged: function(evt) {
    this.connectionName = evt.target.value;
  }
});

module.exports = ConnectView;
