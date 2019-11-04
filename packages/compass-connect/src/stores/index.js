const Reflux = require('reflux');
const sortBy = require('lodash.sortby');
const isEmpty = require('lodash.isempty');
const forEach = require('lodash.foreach');
const omit = require('lodash.omit');
const DataService = require('mongodb-data-service');
const Actions = require('actions');
const Connection = require('mongodb-connection-model');
const ConnectionCollection = Connection.ConnectionCollection;
const StateMixin = require('reflux-state-mixin');
const ipc = require('hadron-ipc');
const userAgent = navigator.userAgent.toLowerCase();
const electron = require('electron');

/**
 * A default driverUrl.
 */
const DEFAULT_DRIVER_URL = 'mongodb://localhost:27017/?readPreference=primary&ssl=false';

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
    this.state.connections.fetch({
      success: () => {
        this.state.connections.forEach((item) => this.state.savedConnections.add(
          item.getAttributes({ props: true })
        ));
        this.trigger(this.state);
      }
    });
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

    forEach(role, (extension) => extension(this));

    this.StatusActions = appRegistry.getAction('Status.Actions');
    this.appRegistry = appRegistry;

    appRegistry.on('clear-current-favorite', () => {
      const ConnectStore = appRegistry.getStore('Connect.Store');

      ConnectStore.state.currentConnection = new Connection();
    });
  },

  /**
   * Gets the initial state of the store.
   *
   * @returns {Object} The state.
   */
  getInitialState() {
    return {
      currentConnection: new Connection(),
      connections: new ConnectionCollection(), // Connections fetched from disc
      savedConnections: new ConnectionCollection(), // To handle discard changes action
      customUrl: '', // URL from connection string input
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      hasUnsavedChanges: false,
      viewType: 'connectionString',
      isHostChanged: false,
      isPortChanged: false,
      isModalVisible: false,
      isMessageVisible: false,
      savedMessage: 'Saved to favorites'
    };
  },

  /** --- Reflux actions ---  */

  /**
  * Hides the favorite message.
  */
  hideFavoriteMessage() {
    this.setState({ isMessageVisible: false });
  },

  /**
   * Hides the favorite modal.
   */
  hideFavoriteModal() {
    this.setState({ isModalVisible: false });
  },

  /**
   * Shows the favorite message.
   */
  showFavoriteMessage() {
    this.setState({ isModalVisible: true });
  },

  /**
   * Shows the favorite modal.
   */
  showFavoriteModal() {
    this.state.isModalVisible = true;
    this.trigger(this.state);
  },

  /**
   * Validates a connection string.
   */
  validateConnectionString() {
    const customUrl = this.state.customUrl;
    const currentConnection = this.state.currentConnection;
    const connections = this.state.connections;
    const currentSaved = connections.find((item) => (
      item._id === currentConnection._id
    ));

    this.state.hasUnsavedChanges = !!currentSaved;

    if (customUrl === '') {
      this._clearForm();
      this._clearConnection();
    } else if (!Connection.isURI(customUrl)) {
      this._setSyntaxErrorMessage('Invalid schema, expected `mongodb` or `mongodb+srv`');
    } else {
      Connection.from(customUrl, (error) => {
        if (error) {
          this._setSyntaxErrorMessage(error.message);
        } else {
          this._resetSyntaxErrorMessage();
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
    const currentConnection = this.state.currentConnection;
    const connections = this.state.connections;
    const driverUrl = currentConnection.driverUrl;
    const customUrl = this.state.customUrl;
    const isValid = this.state.isValid;
    const currentSaved = connections.find((item) => (
      item._id === currentConnection._id
    ));

    this.state.viewType = viewType;

    if (viewType === 'connectionForm') { // Target view
      if (!currentSaved && customUrl === driverUrl) {
        this.state.isHostChanged = true;
        this.state.isPortChanged = true;
        this.trigger(this.state);
      } else if (customUrl === '') {
        this.state.isHostChanged = false;
        this.state.isPortChanged = false;
        this._clearForm();
        this._clearConnection();
      } else if (!Connection.isURI(customUrl)) {
        this._clearConnection();
        this.trigger(this.state);
      } else {
        this.StatusActions.showIndeterminateProgressBar();

        Connection.from(customUrl, (error, parsedConnection) => {
          this.StatusActions.done();

          if (!error) {
            currentConnection.set(this._getPoorAttributes(parsedConnection));

            if (customUrl.match(/[?&]ssl=true/i)) {
              currentConnection.sslMethod = 'SYSTEMCA';
            }

            if (currentSaved) {
              currentConnection.name = currentSaved.name;
              currentConnection.color = currentSaved.color;
              currentConnection.lastUsed = currentSaved.lastUsed;
            }

            this.state.isHostChanged = true;
            this.state.isPortChanged = true;
            this.setState({ currentConnection });
            this._resetSyntaxErrorMessage();
          } else {
            this.state.currentConnection = new Connection();
            this.trigger(this.state);
          }
        });
      }
    } else {
      this.state.customUrl = (
        isValid &&
        (this.state.isHostChanged === true || this.state.isPortChanged === true)
      )
        ? driverUrl
        : customUrl;
      this.trigger(this.state);
    }
  },

  /**
   * Resests URL validation.
   */
  onConnectionFormChanged() {
    const currentConnection = this.state.currentConnection;
    const connections = this.state.connections;
    const currentSaved = connections.find((item) => (
      item._id === currentConnection._id
    ));

    this.setState({
      isValid: true,
      errorMessage: null,
      syntaxErrorMessage: null,
      hasUnsavedChanges: !!currentSaved
    });
  },

  /**
   * Selects a recent connection in the sidebar.
   *
   * @param {Connection} recent - The recent connection to select.
   */
  onRecentSelected(recent) {
    this.setState({
      currentConnection: recent,
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      isHostChanged: true,
      isPortChanged: true,
      hasUnsavedChanges: false,
      viewType: 'connectionForm'
    });
  },

  /**
   * To connect through `DataService` we need a proper connection object.
   * In case of connecting via URI we need to parse URI first to get this object.
   * In case of connecting via the form we can skip a parsing stage and
   * validate instead the existing connection object.
   */
  onConnectClicked() {
    const currentConnection = this.state.currentConnection;

    // We replace custom appname with proper appname
    // to avoid sending malicious value to the server
    currentConnection.appname = electron.remote.app.getName();

    if (this.state.viewType === 'connectionString') {
      const customUrl = this.state.customUrl || DEFAULT_DRIVER_URL;

      this.StatusActions.showIndeterminateProgressBar();

      if (!Connection.isURI(customUrl)) {
        this._setSyntaxErrorMessage('Invalid schema, expected `mongodb` or `mongodb+srv`');
      } else {
        Connection.from(customUrl, (error, parsedConnection) => {
          if (error) {
            this._setSyntaxErrorMessage(error.message);
          } else {
            const isFavorite = currentConnection.isFavorite;
            const driverUrl = currentConnection.driverUrl;

            parsedConnection.appname = currentConnection.appname;

            if (isFavorite && driverUrl !== parsedConnection.driverUrl) {
              this._connect(parsedConnection);
            } else {
              currentConnection.set(this._getPoorAttributes(parsedConnection));
              this._connect(currentConnection);
            }
          }
        });
      }
    } else if (!currentConnection.isValid()) {
      this.setState({
        isValid: false,
        errorMessage: 'The required fields can not be empty'
      });
    } else {
      this.StatusActions.showIndeterminateProgressBar();
      this._connect(currentConnection);
    }
  },

  /**
   * Copies a favorite connection.
   *
   * @param {Connection} connection - The connection to select.
   */
  onCopyConnectionClicked(connection) {
    const newConnection = new Connection();

    newConnection.set(this._getPoorAttributes(connection));
    newConnection.set({ name: `${connection.name} (copy)`, isFavorite: true });

    this._addConnection(newConnection);
  },


  /**
   * Discards favorite changes.
   */
  onFavoriteChangeDiscarded() {
    const connection = this.state.savedConnections.find((item) => (
      item._id === this.state.currentConnection._id
    ));

    this.state.currentConnection.set(this._getPoorAttributes(connection));
    this.state.customUrl = connection.driverUrl;
    this.state.hasUnsavedChanges = false;
    this.trigger(this.state);
  },

  /**
   * Creates a favorite from the current connection.
   *
   * @param {String} name - The favorite name.
   * @param {Object} color - The favorite color.
   */
  onCreateFavoriteClicked(name, color) {
    this.state.currentConnection.color = color;
    this.state.currentConnection.name = name;
    this.state.isMessageVisible = true;
    this._saveFavorite();
  },

  /**
   * Changes customUrl.
   *
   * @param {String} customUrl - A connection string.
   */
  onCustomUrlChanged(customUrl) {
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

        if (connection._id === this.state.currentConnection._id) {
          this.state.currentConnection = new Connection();
        }

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
    this._pruneAll(() => this.trigger(this.state));
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
        this.state.hasUnsavedChanges = false;
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
      const { shell } = electron;

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
    * @param {Connection} favorite - The favorite to select.
    */
  onFavoriteSelected(favorite) {
    const connection = this.state.savedConnections.find((item) => (
      item._id === favorite._id
    ));

    favorite.set(this._getPoorAttributes(connection));
    this.setState({
      currentConnection: favorite,
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      isHostChanged: true,
      isPortChanged: true,
      customUrl: favorite.driverUrl,
      hasUnsavedChanges: false,
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
    this.state.isHostChanged = true;

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
    this.state.isPortChanged = true;
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
   * Resets the connection after clicking on the new connection section.
   */
  onResetConnectionClicked() {
    this.state.viewType = 'connectionString';
    this.state.savedMessage = 'Saved to favorites';
    this.state.currentConnection = new Connection();
    this._clearForm();
    this.trigger(this.state);
  },

  /**
   * Saves a recent connection to favorites.
   *
   * @param {Object} connection - A recent connection.
   */
  onSaveAsFavoriteClicked(connection) {
    this.state.currentConnection = connection;
    this.state.isMessageVisible = true;
    this.state.currentConnection.isFavorite = true;
    this.state.currentConnection.name = `${connection.hostname}:${connection.port}`;
    this.state.savedMessage = 'Saved to favorites';
    this._saveConnection(this.state.currentConnection);
  },

  /**
   * Updates favorite attributes if a favorite already exists.
   */
  onSaveFavoriteClicked() {
    this._saveFavorite();
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
   * Saves a connection in the connections list.
   *
   * @param {Object} connection - A connection.
   */
  _saveConnection(connection) {
    connection.save();
    this.state.savedConnections.add(connection.getAttributes({ props: true }));
    this.trigger(this.state);
  },

  /**
   * Adds a connection to the connections list.
   *
   * @param {Object} connection - A connection.
   */
  _addConnection(connection) {
    this.state.currentConnection = connection;
    this.state.connections.add(connection);
    this._saveConnection(connection);
  },

  /**
   * Clears authentication fields.
   */
  _clearAuthFields() {
    AUTH_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Clears ssl fields.
   */
  _clearSSLFields() {
    SSL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Clears SSH tunnel fields.
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
        success: () => this.state.connections.remove(recents[i]._id)
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
    this.state.isValid = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = error;
    this._clearConnection();
  },

  /**
   * Resets a syntax error message.
   */
  _resetSyntaxErrorMessage() {
    this.state.isValid = true;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.trigger(this.state);
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
        const currentConnection = this.state.currentConnection;
        const connections = this.state.connections;
        const currentSaved = connections.find((item) => (
          item._id === currentConnection._id
        ));

        this.state.isValid = true;
        this.state.isConnected = true;
        this.state.errorMessage = null;
        this.state.syntaxErrorMessage = null;
        this.state.hasUnsavedChanges = false;

        currentConnection.lastUsed = new Date();

        if (currentSaved) {
          this._saveConnection(currentConnection);
        } else {
          this._pruneRecents(() => {
            currentConnection.name = this._addConnection(currentConnection);
          });
        }

        this.appRegistry.emit('data-service-connected', error, ds);
      }
    });
  },

  /**
   * Clears the current connection.
   */
  _clearConnection() {
    const isFavorite = this.state.currentConnection.isFavorite;
    const name = this.state.currentConnection.name;
    const color = this.state.currentConnection.color;
    const connection = new Connection();

    this.state.currentConnection.set(this._getPoorAttributes(connection));
    this.state.currentConnection.set({ isFavorite, name, color });
    this.trigger(this.state);
  },

  /**
   * Clears the form.
   */
  _clearForm() {
    this.state.isValid = true;
    this.state.isConnected = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.state.customUrl = '';
    this.state.hasUnsavedChanges = false;
  },

  /**
   * Persist a favorite on disc.
   */
  _saveFavorite() {
    const currentConnection = this.state.currentConnection;
    const connections = this.state.connections;
    const currentSaved = connections.find((item) => (
      item._id === currentConnection._id
    ));
    const isFavorite = currentConnection.isFavorite;

    if (isFavorite) {
      this.state.savedMessage = 'Favorite is updated';
    }

    currentConnection.isFavorite = true;
    currentConnection.hasUnsavedChanges = false;

    if (this.state.viewType === 'connectionString') {
      Connection.from(this.state.customUrl, (error, parsedConnection) => {
        if (!error) {
          currentConnection.set(this._getPoorAttributes(parsedConnection));

          if (this.state.customUrl.match(/[?&]ssl=true/i)) {
            currentConnection.sslMethod = 'SYSTEMCA';
          }

          if (currentSaved) {
            this._saveConnection(currentConnection);
          } else {
            this._addConnection(currentConnection);
          }
        }
      });
    } else if (!currentConnection.isValid()) {
      this.setState({
        isValid: false,
        errorMessage: 'The required fields can not be empty'
      });
    } else {
      this._addConnection(currentConnection);
    }
  },

  /**
   * Gets connection attributes without data related to favorites.
   *
   * @param {Connection} connection - The connection to select.
   *
   * @returns {Connection} - The poor connection.
   */
  _getPoorAttributes(connection) {
    return omit(
      connection.getAttributes({ props: true }),
      ['_id', 'color', 'isFavorite', 'name']
    );
  }
});

module.exports = Store;
module.exports.EXTENSION = EXTENSION;
