var BehaviorStateMachine = require('./behavior');
var ConnectFormView = require('./connect-form-view');
var Connection = require('../models/connection');
var ConnectionCollection = require('../models/connection-collection');
var MongoDBConnection = require('mongodb-connection-model');
var SidebarWrapperView = require('./sidebar');
var shellToURL = require('mongodb-shell-to-url');
var View = require('ampersand-view');

var _ = require('lodash');
var app = require('hadron-app');

var electron = require('electron');
var remote = electron.remote;
var electronApp = remote.app;
var dialog = remote.dialog;
var Clipboard = remote.clipboard;
var BrowserWindow = remote.BrowserWindow;
var metrics = require('mongodb-js-metrics')();
var COMPASS_ICON_PATH = require('../../icon').path;

var debug = require('debug')('mongodb-compass:connect:index');

/**
 * AuthenticationOptionCollection
 */
var authMethods = require('./authentication');

var indexTemplate = require('./index.jade');

/**
 * SslOptionCollection
 */
var sslMethods = require('./ssl');

/**
 * SshTunnelOptionCollection
 */
var sshTunnelMethods = require('./ssh-tunnel');


var ConnectView = View.extend({
  template: indexTemplate,
  screenName: 'Connect',
  props: {
    form: 'state',
    stateMachine: 'state',
    connection: 'state',
    message: {
      type: 'string',
      default: ''
    },
    showFavoriteButtons: {
      type: 'boolean',
      default: false
    },
    showSaveButton: {
      type: 'boolean',
      default: false
    },
    connectionName: {
      type: 'string',
      default: ''
    },
    nameConflict: {
      type: 'boolean',
      default: false
    },
    authMethod: {
      type: 'string',
      default: 'NONE'
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
    },
    sshTunnelMethod: {
      type: 'string',
      default: 'NONE'
    },
    previousSshTunnelMethod: {
      type: 'string',
      default: null
    },
    clipboardText: {
      type: 'string',
      default: ''
    }
  },
  derived: {
    hasError: {
      deps: ['message'],
      fn: function() {
        return this.message !== '';
      }
    },
    connectionNameEmpty: {
      deps: ['connectionName'],
      fn: function() {
        return this.connectionName === '';
      }
    },
    isFavorite: {
      deps: ['stateMachine.state'],
      fn: function() {
        return _.startsWith(this.stateMachine.state, 'FAV_');
      }
    }
  },
  collections: {
    connections: ConnectionCollection
  },
  events: {
    'change select[name=authentication]': 'onAuthMethodChanged',
    'change select[name=ssl]': 'onSslMethodChanged',
    'change select[name=ssh_tunnel]': 'onSshTunnelMethodChanged',
    'click [data-hook=create-favorite-button]': 'onCreateFavoriteClicked',
    'click [data-hook=remove-favorite-button]': 'onRemoveFavoriteClicked',
    'click [data-hook=save-changes-button]': 'onSaveChangesClicked',
    'input input[name=name]': 'onNameInputChanged',
    'change input[name=name]': 'onNameInputChanged',
    'input input': 'onAnyInputChanged',
    'change input': 'onAnyInputChanged',
    'change select': 'onAnyInputChanged',
    'click div.btn': 'onAnyInputChanged'
  },

  /**
   * Event handlers listening to UI events. These are very lightweight
   * methods that simply set a property or dispatch an action. The heavy
   * lifting is done in @see ./querybuilder.js.
   *
   * @see `events` above
   */

  onAuthMethodChanged: function(evt) {
    this.authMethod = evt.target.value;
  },

  onSslMethodChanged: function(evt) {
    this.sslMethod = evt.target.value;
  },

  onSshTunnelMethodChanged: function(evt) {
    this.sshTunnelMethod = evt.target.value;
  },

  onNameInputChanged: function(evt) {
    this.connectionName = evt.target.value;
    var nameField = this.form.getField('name');
    this.nameConflict = Boolean(nameField.value && !nameField.valid);
  },

  onAnyInputChanged: function() {
    this.form.checkValid();
    this.dispatch('any field changed');
  },

  onCreateFavoriteClicked: function() {
    this.dispatch('create favorite clicked');
  },

  onRemoveFavoriteClicked: function() {
    this.dispatch('remove favorite clicked');
  },

  onSaveChangesClicked: function() {
    this.dispatch('save changes clicked');
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
    showFavoriteButtons: {
      type: 'toggle',
      hook: 'favorite-buttons'
    },
    showSaveButton: {
      type: 'toggle',
      hook: 'save-changes-button'
    },
    nameConflict: [
      {
        type: 'booleanAttribute',
        hook: 'save-changes-button',
        yes: 'disabled'
      },
      {
        type: 'booleanAttribute',
        hook: 'create-favorite-button',
        yes: 'disabled'
      }
    ],
    connectionNameEmpty: [
      {
        type: 'booleanAttribute',
        hook: 'save-changes-button',
        yes: 'disabled'
      },
      {
        type: 'booleanAttribute',
        hook: 'create-favorite-button',
        yes: 'disabled'
      }
    ]
  },
  subviews: {
    sidebar: {
      hook: 'sidebar-subview',
      prepareView: function(el) {
        debug('sidebar prepare');
        return new SidebarWrapperView({
          el: el,
          parent: this,
          connections: this.connections
        });
      }
    }
  },
  initialize: function() {
    document.title = `${electronApp.getName()} - Connect`;
    this.StatusAction = app.appRegistry.getAction('Status.Actions');
    this.connections.once('sync', this.updateConflictingNames.bind(this));
    // use {reset: true} to trigger `reset` event so ConnectionCollection
    // can add its listeners to the models.
    this.connections.fetch({reset: true});
    this.stateMachine = new BehaviorStateMachine({view: this});
    this.on('change:connectionNameEmpty',
      this.connectionNameEmptyChanged.bind(this));
  },
  render: function() {
    this.renderWithTemplate({
      authMethods: authMethods.serialize(),
      sslMethods: sslMethods.serialize(),
      sshTunnelMethods: sshTunnelMethods.serialize()
    });

    this.form = new ConnectFormView({
      parent: this,
      el: this.queryByHook('connect-form'),
      autoRender: true,
      autoAppend: false
    });

    this.registerSubview(this.form);

    this.listenToAndRun(this, 'change:authMethod',
      this.replaceAuthMethodFields.bind(this));

    this.listenToAndRun(this, 'change:sslMethod',
      this.replaceSslMethodFields.bind(this));

    this.listenToAndRun(this, 'change:sshTunnelMethod',
      this.replaceSshTunnelMethodFields.bind(this));

    // add event listener to focus event and also check on app launch
    this.boundOnConnectWindowFocused = this.onConnectWindowFocused.bind(this);
    window.addEventListener('focus', this.boundOnConnectWindowFocused);
    this.onConnectWindowFocused();

    // always start in NEW_EMPTY state
    this.dispatch('new connection clicked');
  },
  remove: function() {
    window.removeEventListener('focus', this.boundOnConnectWindowFocused);
    return View.prototype.remove.call(this);
  },

  // === MongoDB URI clipboard Handling

  /**
   * Called when the user clicked "YES" in the message dialog after
   * a MongoDB URI was detected.
   */
  autofillFromClipboard: function() {
    this.connection = Connection.from(this.clipboardText);
    // don't use "Local" as favorite name, keep field empty
    this.connection.name = '';
    // if the URI contains ssl=true, switch to SYSTEMCA by default
    if (this.clipboardText.match(/[?&]ssl=true/i)) {
      this.connection.ssl = 'SYSTEMCA';
    }
    this.updateForm();
    // @note: durran: This fixes not being able to save a new favorite
    //  from a collection that was auto-filled from the clipboard. Needed
    //  to be instantiated as new before saving otherwise it would get an
    //  error saying 'url' needed to be defined.
    this.connection = null;
  },

  /**
   * Called when the Connect Window receives focus.
   */
  onConnectWindowFocused: function() {
    var clipboardText = Clipboard.readText();
    // first try to parse with shell-to-url package
    const url = shellToURL(clipboardText);
    if (url) {
      clipboardText = url;
    }
    if (clipboardText === this.clipboardText) {
      // we have seen this value already, don't ask user again
      return;
    }
    this.clipboardText = clipboardText;
    if (MongoDBConnection.isURI(clipboardText)) {
      debug('MongoDB URI detected.', clipboardText);
      // ask user if Compass should use it to fill out form
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        icon: COMPASS_ICON_PATH,
        message: 'MongoDB connection string detected',
        detail: 'Compass detected a MongoDB connection string in your '
          + 'clipboard. Do you want to use the connection string to '
          + 'fill out this form?',
        buttons: ['Yes', 'No']
      }, function(response) {
        // track clipboard feature with user response
        metrics.track('Clipboard Detection', 'used', {
          answer: response === 0 ? 'yes' : 'no'
        });
        if (response === 0) {
          this.autofillFromClipboard();
        }
      }.bind(this));
    }
  },

  connectionNameEmptyChanged: function() {
    if (this.connectionNameEmpty) {
      this.dispatch('name removed');
    } else {
      this.dispatch('name added');
    }
  },

  // === External hooks

  /**
   * called by SidebarView#onNewConnectionClicked
   * @see ./sidebar.js
   */
  createNewConnection: function() {
    this.dispatch('new connection clicked');
  },

  /**
   * called by SidebarView#onItemClick
   * @param {Object} connection   the selected connection model
   * @see ./sidebar.js
   */
  selectExistingConnection: function(connection) {
    this.connection = connection;
    this.updateForm();
    if (connection.is_favorite) {
      this.dispatch('favorite connection clicked');
    } else {
      this.dispatch('history connection clicked');
    }
  },

  /**
   * called by SidebarView#submitCallback
   * @param {Object} obj   the submitted data
   * @see ./sidebar.js
   */
  submitForm: function() {
    this.dispatch('connect clicked');
  },

  /**
   * convenience method that dispatches an action with the state machine.
   *
   * @param  {String} action  the action to dispatch
   */
  dispatch: function(action) {
    this.stateMachine.dispatch(action);
  },

  /**
   * Update the form's state based on an existing connection. This will update
   * the auth fields and populate all fields with the connection details.
   *
   * Called by `this._stateFavUnchanged` and `this._stateHistoryUnchanged`.
   *
   * @param {Connection} connection
   */
  updateConnection: function() {
    if (this.connection) {
      this.connection.set(this.form.data);
    } else {
      this.connection = new Connection(this.form.data);
    }
    this.connection.is_favorite = true;
    this.connection.save(null, {
      validate: false
    });
    this.connections.add(this.connection, {
      merge: true
    });
  },

  /**
   *
   * remove favorite, then saves the connection (if it has been used before)
   * or destroys it (if it was never used).
   *
   * @param {Connection} connection
   */
  removeFavoriteConnection: function() {
    this.connection.is_favorite = false;
    this.connection.name = '';
    if (this.connection.last_used === null) {
      this.connection.destroy();
      // this.connections.deactivateAll();
      //   @note: durran: This is raising an error that the method is not found.
      //   Removing doesn't seem to break anything. What was the intention?
      this.createNewConnection();
    } else {
      this.connection.save(null);
      this.updateForm();
    }
  },

  /**
   * Runs a validation on the connection. If it fails, show error banner.
   *
   * @param {Connection} connection
   */
  validateConnection: function(connection) {
    if (!connection.isValid()) {
      this.onError(connection.validationError);
      this.dispatch('error received');
      return;
    }
    this.StatusAction.showIndeterminateProgressBar();

    var onSave = function() {
      this.connections.add(this.connection, { merge: true });
      this.sidebar.render();
      this.useConnection();
    };

    connection.test(function(err) {
      if (!err) {
        // now save connection
        this.connection = connection;
        this.connection.save({ last_used: new Date() }, { success: onSave.bind(this) });
      } else {
        // hide the status bar on error. On success, it is hidden in ./src/app/index.js
        debugger;
        this.StatusAction.hide();
        this.onError(err, connection);
        this.dispatch('error received');
        return;
      }
    }.bind(this));
  },

  /**
   * Will open a new schema window with the connection details and close the
   * connection dialog
   *
   * @param {Object} connection    can also be externally called (e.g.
   * Sidebar#onItemDoubleClick)
   */
  useConnection: function(connection) {
    connection = connection || this.connection;
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    debugger;
    StatusAction.hide();
    metrics.track('Connection', 'used', {
      authentication: connection.authentication,
      ssl: connection.ssl,
      'localhost': connection.hostname === 'localhost',
      'default port': connection.port === 27017,
      'outcome': 'success'
    });

    var view = this;
    app.setConnectionId(connection.getId(), function() {
      app.navigate('home', {
        params: {
          connectionId: connection.getId()
        },
        silent: false
      });
      view.remove();
      debugger;
      StatusAction.hideStaticSidebar();
    });
  },

  /**
   * Updates the input field view responsible for the friendly name. Provides
   * a list of existing connection names so that the field can validate against
   * them. We want to avoid creating connection favorites with duplicate names.
   */
  updateConflictingNames: function() {
    var conflicts = this.connections.filter(function(model) {
      if (this.connection && this.connection.getId() === model.getId()) {
        return false;
      }
      return model.is_favorite;
    }.bind(this));
    var nameField = this.form.getField('name');
    nameField.conflicting = _.pluck(conflicts, 'name');
  },

  /**
   * Fill in the form based on this.connection, also adds/removes the auth
   * and ssl fields.
   */
  updateForm: function() {
    this.updateConflictingNames();

    // If the new model has auth, expand the auth settings container and select
    // the correct tab.
    this.authMethod = this.connection.authentication;
    this.sslMethod = this.connection.ssl;
    this.sshTunnelMethod = this.connection.ssh_tunnel;

    // Changing `this.authMethod` and `this.sslMethod` dynamically updates
    // the form fields so we need to get a list of what keys are currently
    // available to set.
    var keys = [
      'name',
      'port',
      'hostname',
      'replica_set_name',
      'read_preference',
      'authentication',
      'ssl',
      'ssh_tunnel'
    ];
    if (this.connection.authentication !== 'NONE') {
      keys.push.apply(keys, _.pluck(authMethods.get(this.authMethod).fields, 'name'));
    }
    if (this.connection.ssl !== 'NONE') {
      keys.push.apply(keys, _.pluck(sslMethods.get(this.sslMethod).fields, 'name'));
    }
    if (this.connection.ssh_tunnel !== 'NONE') {
      keys.push.apply(keys, _.pluck(sshTunnelMethods.get(this.sshTunnelMethod).fields, 'name'));
    }

    // make connection active, and (implicitly) all others inactive
    this.connection.active = true;

    // populate the form from values in the model.
    var values = _.pick(this.connection, keys);
    this.form.setValues(values);

    this.connectionName = values.name;
  },

  /**
   * If there is a validation or connection error show a nice message.
   *
   * @param {Error} err
   * @param {Connection} connection
   * @api private
   */
  onError: function(err, connection) {
    metrics.track('Connection', 'used', {
      authentication: connection.authentication,
      ssl: connection.ssl,
      'localhost': connection.hostname === 'localhost',
      'default port': connection.port === 27017,
      'outcome': 'error'
    });
    metrics.error(err);
    debug('showing error message', {
      err: err,
      model: connection
    });
    this.message = err.message;
  },

  /**
   * called when this.authMethod changes. Replaces the fields in `this.form`.
   */
  replaceAuthMethodFields: function() {
    // remove and unregister old fields
    var oldFields = _.get(authMethods.get(this.previousAuthMethod), 'fields', []);
    _.each(oldFields, function(field) {
      this.form.removeField(field.name);
      if (this.connection) {
        this.connection.unset(field.name);
      }
    }.bind(this));

    // register new with form, render, append to DOM
    var newFields = authMethods.get(this.authMethod).fields;
    _.each(newFields, function(field) {
      this.form.addField(field.render());
      this.query('#auth-' + this.authMethod).appendChild(field.el);
    }.bind(this));

    this.previousAuthMethod = this.authMethod;
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
  },

  /**
   * called when this.sshTunnelMethod changes. Replaces the fields in `this.form`.
   */
  replaceSshTunnelMethodFields: function() {
    // remove and unregister old fields
    var oldFields = _.get(sshTunnelMethods.get(this.previousSshTunnelMethod), 'fields', []);
    _.each(oldFields, function(field) {
      this.form.removeField(field.name);
    }.bind(this));

    // register new with form, render, append to DOM
    var newFields = sshTunnelMethods.get(this.sshTunnelMethod).fields;
    _.each(newFields, function(field) {
      this.form.addField(field.render());
      this.query('#ssh_tunnel-' + this.sshTunnelMethod).appendChild(field.el);
    }.bind(this));

    this.previousSshTunnelMethod = this.sshTunnelMethod;
  }

});

module.exports = ConnectView;
