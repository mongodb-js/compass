const Reflux = require('reflux');
const sortBy = require('lodash.sortby');
const isEmpty = require('lodash.isempty');
const forEach = require('lodash.foreach');
const DataService = require('mongodb-data-service');
const Actions = require('actions');
const Connection = require('mongodb-connection-model');
const ConnectionCollection = Connection.ConnectionCollection;
const StateMixin = require('reflux-state-mixin');
const ipc = require('hadron-ipc');
const userAgent = navigator.userAgent.toLowerCase();

/**
 * All the authentication strategy related fields on the connection model, with
 * the exception of the method.
 */
const AUTH_FIELDS = [
  'mongodbUsername',
  'mongodbPassword',
  'mongodbDatabaseName',
  'kerberosPrincipal',
  'kerberosPassword',
  'kerberosServiceName',
  'x509Username',
  'ldapUsername',
  'ldapPassword'
];

/**
 * All the SSL related fields on the connection model, with the exception
 * of the method.
 */
const SSL_FIELDS = [
  'sslCA',
  'sslCert',
  'sslKey',
  'sslPass'
];

/**
 * All the ssh tunnel related fields on the connection model, with the
 * exception of the method.
 */
const SSH_TUNNEL_FIELDS = [
  'sshTunnelHostname',
  'sshTunnelPort',
  'sshTunnelBindToLocalPort',
  'sshTunnelUsername',
  'sshTunnelPassword',
  'sshTunnelIdentityFile',
  'sshTunnelPassphrase',
  'replicaSet'
];

/**
 * The role name for plugin extensions.
 */
const EXTENSION = 'Connect.Extension';

/**
 * The store that backs the connect plugin.
 */
const Store = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: Actions,

  /** --- Reflux lifecycle methods ---  */

  /**
   * Fetch all the connections on init.
   */
  init() {
    this.state.connections.fetch({ success: () => this.trigger(this.state) });
    ipc.on('app:disconnect', this.onDisconnectClicked.bind(this));
  },

  /**
   * On activation of the app registry, we search for extensions defined by plugins
   * and execute their extension functions with the store instance and the actions.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    const role = appRegistry.getRole(EXTENSION) || [];

    forEach(role, (extension) => {
      extension(this);
    });

    this.StatusActions = appRegistry.getAction('Status.Actions');
    this.appRegistry = appRegistry;
  },

  /**
   * Gets the initial state of the store.
   *
   * @returns {Object} The state.
   */
  getInitialState() {
    return {
      currentConnection: new Connection(),
      connections: new ConnectionCollection(),
      customUrl: 'mongodb://localhost:27017/?readPreference=primary&ssl=false',
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      viewType: 'connectionString'
    };
  },

  /** --- Reflux actions ---  */

  /**
   * Validates a connection string.
   */
  validateConnectionString() {
    const customUrl = this.state.customUrl;

    if (customUrl === '') {
      this._cleanConnection();
      this.trigger(this.state);
    } else if (!Connection.isURI(customUrl)) {
      this._setSyntaxErrorMessage('Invalid schema, expected `mongodb` or `mongodb+srv`');
      this.trigger(this.state);
    } else {
      Connection.from(customUrl, (error) => {
        if (error) {
          this._setSyntaxErrorMessage(error.message);
          this.trigger(this.state);
        } else {
          this._resetSyntaxErrorMessage();
          this.trigger(this.state);
        }
      });
    }
  },

  /**
   * Changes the auth source.
   *
   * @param {String} authSource - The auth source.
   */
  onAuthSourceChanged(authSource) {
    this.state.currentConnection.mongodbDatabaseName = authSource;
    this.trigger(this.state);
  },

  /**
   * Changes authStrategy
   *
   * @param {String} method - The auth strategy.
   */
  onAuthStrategyChanged(method) {
    this._clearAuthFields();
    this.state.currentConnection.authStrategy = method;
    this.trigger(this.state);
  },

  /**
   * Changes viewType and parses URI to fill in a connection form.
   *
   * @param {String} viewType - A view type.
   */
  onChangeViewClicked(viewType) {
    const driverUrl = this.state.currentConnection.driverUrl;
    const customUrl = this.state.customUrl;
    const isValid = this.state.isValid;

    this.state.viewType = viewType;

    if (customUrl === '') {
      this._cleanConnection();
      this.trigger(this.state);
    } else if (viewType === 'connectionForm') { // Terget view
      if (!Connection.isURI(customUrl)) {
        this.state.currentConnection = new Connection();
        this.trigger(this.state);
      } else {
        this.StatusActions.showIndeterminateProgressBar();
        Connection.from(customUrl, (error, connection) => {
          if (!error) {
            this._resetSyntaxErrorMessage();
            this.StatusActions.done();

            if (this.state.customUrl.match(/[?&]ssl=true/i)) {
              connection.sslMethod = 'SYSTEMCA';
            }

            connection.name = '';

            this.state.currentConnection = connection;
            this.trigger(this.state);
          }
        });
      }
    } else {
      this.state.customUrl = isValid ? driverUrl : customUrl;
      this.trigger(this.state);
    }
  },

  /**
   * Resests URL validation.
   */
  onConnectionFormChanged() {
    this.setState({
      isValid: true,
      errorMessage: null,
      syntaxErrorMessage: null
    });
  },

  /**
   * Selects a connection in the sidebar.
   *
   * @param {Connection} connection - The connection to select.
   */
  onConnectionSelected(connection) {
    this.setState({
      currentConnection: connection,
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null
    });
  },

  /**
   * To connect through `DataService` we need a proper connection object.
   * In case of connecting via URI we need to parse URI first to get this object.
   * In case of connecting via the form we can skip a parsing stage and
   * validate instead the existing connection object.
   */
  onConnectClicked() {
    if (this.state.viewType === 'connectionString') {
      const customUrl = this.state.customUrl;

      if (customUrl === '') {
        this._cleanConnection();
        this._setSyntaxErrorMessage('The connection string can not be empty');
        this.trigger(this.state);
      } else {
        this.StatusActions.showIndeterminateProgressBar();
        if (!Connection.isURI(customUrl)) {
          this._setSyntaxErrorMessage('Invalid schema, expected `mongodb` or `mongodb+srv`');
          this.trigger(this.state);
        } else {
          Connection.from(customUrl, (error, connection) => {
            if (error) {
              this._setSyntaxErrorMessage(error.message);
              this.trigger(this.state);
            } else {
              this._connect(connection);
            }
          });
        }
      }
    } else {
      const currentConnection = this.state.currentConnection;

      if (!currentConnection.isValid()) {
        this.setState({
          isValid: false,
          errorMessage: 'The required fields can not be empty'
        });
      } else {
        this.StatusActions.showIndeterminateProgressBar();
        this._connect(currentConnection);
      }
    }
  },

  /**
   * Creates a favorite from the current connection.
   */
  onCreateFavoriteClicked() {
    const connection = this.state.currentConnection;

    connection.isFavorite = true;

    this._addConnection(connection);
  },

  /**
   * Creates a recent connection from the current connection.
   */
  onCreateRecentClicked() {
    const connection = this.state.currentConnection;

    connection.lastUsed = new Date();

    this._pruneRecents(() => {
      this._addConnection(connection);
    });
  },

  /**
   * Changes customUrl.
   *
   * @param {String} customUrl - A connection string.
   */
  onCustomUrlChanged(customUrl) {
    this.state.isChanged = true;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.state.customUrl = customUrl;
    this.trigger(this.state);
  },

  /**
   * Deletes a connection.
   *
   * @param {Connection} connection - The connection to delete.
   */
  onDeleteConnectionClicked(connection) {
    connection.destroy({
      success: () => {
        this.state.connections.remove(connection._id);
        this.state.currentConnection = new Connection();
        this.trigger(this.state);
      }
    });
  },

  /**
   * Deletes all recents.
   *
   * @param {Connection} connection - Connections to delete.
   */
  onDeleteConnectionsClicked() {
    this._pruneAll(() => {
      this.trigger(this.state);
    });
  },

  /**
   * Disconnects the current connection.
   */
  onDisconnectClicked() {
    if (this.dataService) {
      this.dataService.disconnect(() => {
        this.appRegistry.emit('data-service-disconnected');
        this.state.isValid = true;
        this.state.isConnected = false;
        this.state.errorMessage = null;
        this.state.syntaxErrorMessage = null;
        this.state.viewType = 'connectionString';
        this.trigger(this.state);
        this.dataService = undefined;
      });
    }
  },

  /**
   * Visits external page.
   *
   * @param {String} href - A link to external page.
   * @param {String} event - appRegistry event.
   */
  onExternalLinkClicked(href, event) {
    if (userAgent.indexOf('electron') > -1) {
      const { shell } = require('electron');

      shell.openExternal(href);
    } else {
      window.open(href, '_new');
    }

    if (event) {
      this.appRegistry.emit(event);
    }
  },

  /**
   * Changes the favorite name.
   *
   * @param {String} name - The favorite name.
   */
  onFavoriteNameChanged(name) {
    this.state.currentConnection.name = name;
    this.trigger(this.state);
  },

  /**
    * Selects a favorite connection.
    *
    * @param {Connection} connection - The connection to select.
    */
  onFavoriteSelected(connection) {
    this.setState({
      currentConnection: connection,
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      viewType: 'connectionForm'
    });
  },

  /**
   * Changes the host name. If the hostname contains mongodb.net then
   * then its an Atlas instance and we change the SSL settings.
   *
   * @param {String} hostname - The hostname.
   */
  onHostnameChanged(hostname) {
    this.state.currentConnection.hostname = hostname.trim();

    if (hostname.match(/mongodb\.net/i)) {
      this.state.currentConnection.sslMethod = 'SYSTEMCA';
    }

    this.trigger(this.state);
  },

  /**
   * Changes the password.
   *
   * @param {String} password - The password.
   */
  onPasswordChanged(password) {
    this.state.currentConnection.mongodbPassword = password;
    this.trigger(this.state);
  },

  /**
   * Changes the port.
   *
   * @param {String} port - The port.
   */
  onPortChanged(port) {
    this.state.currentConnection.port = port.trim();
    this.trigger(this.state);
  },

  /**
   * Changes the read preference.
   *
   * @param {String} readPreference - The read preference.
   */
  onReadPreferenceChanged(readPreference) {
    this.state.currentConnection.readPreference = readPreference;
    this.trigger(this.state);
  },

  /**
   * Changes the replica set name.
   *
   * @param {String} replicaSet - The replica set name.
   */
  onReplicaSetChanged(replicaSet) {
    this.state.currentConnection.replicaSet = replicaSet.trim();
    this.trigger(this.state);
  },

  /**
   * Saves a connection.
   *
   * @param {Connection} connection - The connection.
   */
  onSaveConnectionClicked(connection) {
    connection.save({
      success: () => {
        this.trigger(this.state);
      }
    });
  },

  /**
   * Resets the connection after clicking on the new connection section.
   */
  onResetConnectionClicked() {
    this.state.viewType = 'connectionString';
    this._cleanConnection();
    this.trigger(this.state);
  },

  /**
   * Changes the SSL CA.
   *
   * @param {Array} files - The files.
   */
  onSSLCAChanged(files) {
    this.state.currentConnection.sslCA = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL certificate.
   *
   * @param {Array} files - The files.
   */
  onSSLCertificateChanged(files) {
    this.state.currentConnection.sslCert = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL method.
   *
   * @param {String} method - The SSL method.
   */
  onSSLMethodChanged(method) {
    this._clearSSLFields();
    this.state.currentConnection.sslMethod = method;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL private key.
   *
   * @param {Array} files - The files.
   */
  onSSLPrivateKeyChanged(files) {
    this.state.currentConnection.sslKey = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL password.
   *
   * @param {String} password - The password.
   */
  onSSLPrivateKeyPasswordChanged(password) {
    this.state.currentConnection.sslPass = password;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel password.
   *
   * @param {String} password - The password.
   */
  onSSHTunnelPasswordChanged(password) {
    this.state.currentConnection.sshTunnelPassword = password;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel passphrase.
   *
   * @param {String} passphrase - The passphrase.
   */
  onSSHTunnelPassphraseChanged(passphrase) {
    this.state.currentConnection.sshTunnelPassphrase = passphrase;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel hostname.
   *
   * @param {String} hostname - The hostname.
   */
  onSSHTunnelHostnameChanged(hostname) {
    this.state.currentConnection.sshTunnelHostname = hostname;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel username.
   *
   * @param {String} username - The username.
   */
  onSSHTunnelUsernameChanged(username) {
    this.state.currentConnection.sshTunnelUsername = username;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel port.
   *
   * @param {String} port - The port.
   */
  onSSHTunnelPortChanged(port) {
    this.state.currentConnection.sshTunnelPort = port;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel identity file.
   *
   * @param {Array} files - The file.
   */
  onSSHTunnelIdentityFileChanged(files) {
    this.state.currentConnection.sshTunnelIdentityFile = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel method.
   *
   * @param {String} tunnel - The method.
   */
  onSSHTunnelChanged(tunnel) {
    this._clearSSHTunnelFields();
    this.state.currentConnection.sshTunnel = tunnel;
    this.trigger(this.state);
  },

  /**
   * Changes the srv record flag.
   */
  onSRVRecordToggled() {
    this.state.currentConnection.isSrvRecord = !this.state.currentConnection.isSrvRecord;
    this.trigger(this.state);
  },

  /**
   * Changes the username.
   *
   * @param {String} username - The username.
   */
  onUsernameChanged(username) {
    this.state.currentConnection.mongodbUsername = username;
    this.trigger(this.state);
  },

  /** --- Help methods ---  */

  /**
   * Updates default values for the connection depending on the authentication
   * strategy method and database values.
   */
  _updateDefaults() {
    const connection = this.state.currentConnection;

    if (
      (connection.authStrategy === 'MONGODB' || connection.authStrategy === 'SCRAM-SHA-256') &&
      isEmpty(connection.mongodbDatabaseName)
    ) {
      connection.mongodbDatabaseName = 'admin';
    } else if (connection.authStrategy === 'KERBEROS' && isEmpty(connection.kerberosServiceName)) {
      connection.kerberosServiceName = 'mongodb';
    }
  },

  /**
   * Adds a connection to connections list.
   *
   * @param {Object} connection - A connection.
   */
  _addConnection(connection) {
    this.state.connections.add(connection);
    connection.save();
    this.trigger(this.state);
  },

  /**
   * Cleans authentication fields.
   */
  _clearAuthFields() {
    AUTH_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Cleans ssl fields.
   */
  _clearSSLFields() {
    SSL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Cleans SSH tunnel fields.
   */
  _clearSSHTunnelFields() {
    SSH_TUNNEL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Deletes all recents connections.
   *
   * @param {Function} done - The callback function.
   */
  _pruneAll(done) {
    const recents = this.state.connections
      .filter((connection) => !connection.isFavorite);

    for (let i = 0; i < recents.length; i++) {
      recents[i].destroy({
        success: () => {
          this.state.connections.remove(recents[i]._id);
        }
      });
    }

    done();
  },

  /**
   * Keeps 10 recent connections and deletes rest of them.
   *
   * @param {Function} done - The callback function.
   */
  _pruneRecents(done) {
    const recents = this.state.connections
      .filter((connection) => !connection.isFavorite);

    if (recents.length === 10) {
      const sortedRecents = sortBy(recents, 'lastUsed');
      const toDelete = sortedRecents[9];

      toDelete.destroy({
        success: () => {
          this.state.connections.remove(toDelete._id);

          return done();
        }
      });
    }

    done();
  },

  /**
   * Sets a syntax error message.
   *
   * @param {Object} error - Error.
   */
  _setSyntaxErrorMessage(error) {
    this.state.currentConnection = new Connection();
    this.state.isValid = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = error;
  },

  /**
   * Resets a syntax error message.
   */
  _resetSyntaxErrorMessage() {
    this.state.isValid = true;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
  },

  /**
   * Connects to the current connection. If connection is successful then a new
   * recent connection is created.
   *
   * @param {Object} connection - The current connection.
   */
  _connect(connection) {
    this._updateDefaults();
    this.dataService = new DataService(connection);
    this.appRegistry.emit('data-service-initialized', this.dataService);

    this.dataService.connect((error, ds) => {
      if (error) {
        this.StatusActions.done();
        this.setState({
          isValid: false,
          errorMessage: error.message,
          syntaxErrorMessage: null
        });
      } else {
        // @note: onCreateRecentClicked will handle the store triggering,
        // no need to do it twice.
        this.setState({
          isValid: true,
          isConnected: true,
          errorMessage: null,
          syntaxErrorMessage: null
        });
        this.appRegistry.emit('data-service-connected', error, ds);
        this.onCreateRecentClicked();
      }
    });
  },

  /**
   * Cleans the current connection section.
   */
  _cleanConnection() {
    this.state.currentConnection = new Connection();
    this.state.isValid = true;
    this.state.isConnected = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
  }
});

module.exports = Store;
module.exports.EXTENSION = EXTENSION;
