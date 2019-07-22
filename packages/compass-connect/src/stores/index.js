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
const { shell } = require('electron');

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
 * Atlas link.
 */
const ATLAS_LINK = 'https://www.mongodb.com/cloud/atlas/lp/general?jmp=compass';

/**
 * Learn more link.
 */
const LEARN_MORE = 'https://www.mongodb.com/cloud/atlas';

/**
 * The store that backs the connect plugin.
 */
const Store = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: Actions,

  /**
   * Fetch all the connections on init.
   */
  init() {
    this.state.connections.fetch({
      success: () => {
        this.trigger(this.state);
      }
    });
    ipc.on('app:disconnect', this.onDisconnect.bind(this));
  },

  /**
   * On activation of the app registry, we search for extensions defined by plugins
   * and execute their extension functions with the store instance and the actions.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    forEach(appRegistry.getRole(EXTENSION) || [], (extension) => {
      extension(this);
    });
    this.StatusActions = appRegistry.getAction('Status.Actions');
    this.appRegistry = appRegistry;
  },

  /**
   * Resets the connection after clicking on the new connection section.
   */
  resetConnection() {
    this.setState({
      currentConnection: new Connection(),
      isValid: true,
      isConnected: false,
      errorMessage: null
    });
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
   * Changes the username.
   *
   * @param {String} username - The username.
   */
  onUsernameChanged(username) {
    this.state.currentConnection.mongodbUsername = username;
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
   * Changes the auth source.
   *
   * @param {String} authSource - The auth source.
   */
  onAuthSourceChanged(authSource) {
    this.state.currentConnection.mongodbDatabaseName = authSource;
    this.trigger(this.state);
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
   * Change the srv record flag.
   */
  onSRVRecordToggle() {
    this.state.currentConnection.isSrvRecord = !this.state.currentConnection.isSrvRecord;
    this.trigger(this.state);
  },

  /**
   * Change the port.
   *
   * @param {String} port - The port.
   */
  onPortChanged(port) {
    this.state.currentConnection.port = port.trim();
    this.trigger(this.state);
  },

  /**
   * Change the read preference.
   *
   * @param {String} readPreference - The read preference.
   */
  onReadPreferenceChanged(readPreference) {
    this.state.currentConnection.readPreference = readPreference;
    this.trigger(this.state);
  },

  /**
   * Change the replica set name.
   *
   * @param {String} replicaSet - The replica set name.
   */
  onReplicaSetChanged(replicaSet) {
    this.state.currentConnection.replicaSet = replicaSet.trim();
    this.trigger(this.state);
  },

  /**
   * Change the SSL method.
   *
   * @param {String} method - The SSL method.
   */
  onSSLMethodChanged(method) {
    this._clearSSLFields();
    this.state.currentConnection.sslMethod = method;
    this.trigger(this.state);
  },

  /**
   * Change the SSL ca.
   *
   * @param {Array} files - The files.
   */
  onSSLCAChanged(files) {
    this.state.currentConnection.sslCA = files;
    this.trigger(this.state);
  },

  /**
   * Change the SSL certificate.
   *
   * @param {Array} files - The files.
   */
  onSSLCertificateChanged(files) {
    this.state.currentConnection.sslCert = files;
    this.trigger(this.state);
  },

  /**
   * Change the SSL private key.
   *
   * @param {Array} files - The files.
   */
  onSSLPrivateKeyChanged(files) {
    this.state.currentConnection.sslKey = files;
    this.trigger(this.state);
  },

  /**
   * Change the SSL password.
   *
   * @param {String} password - The password.
   */
  onSSLPrivateKeyPasswordChanged(password) {
    this.state.currentConnection.sslPass = password;
    this.trigger(this.state);
  },

  /**
   * Change the favorite name.
   *
   * @param {String} name - The favorite name.
   */
  onFavoriteNameChanged(name) {
    this.state.currentConnection.name = name;
    this.trigger(this.state);
  },

  /**
   * Create a favorite from the current connection.
   */
  onCreateFavorite() {
    const connection = this.state.currentConnection;
    connection.isFavorite = true;
    this._addConnection(connection);
  },

  /**
   * Create a recent connection from the current connection.
   */
  onCreateRecent() {
    const connection = this.state.currentConnection;
    connection.lastUsed = new Date();
    this._pruneRecents(() => {
      this._addConnection(connection);
    });
  },

  /**
   * Select a connection in the sidebar.
   *
   * @param {Connection} connection - The connection to select.
   */
  onConnectionSelected(connection) {
    this.setState({
      currentConnection: connection,
      isValid: true,
      isConnected: false,
      errorMessage: null
    });
  },

  /**
   * Delete all recents
   *
   * @param {Connection} connection - The connection to delete.
   */
  onDeleteConnections() {
    this._pruneAll(() => {
      this.trigger(this.state);
    });
  },

  /**
   * Delete a connection.
   *
   * @param {Connection} connection - The connection to delete.
   */
  onDeleteConnection(connection) {
    console.log('connection----------------------');
    console.log(connection);
    console.log('----------------------');
    connection.destroy({
      success: () => {
        console.log('this.state.connections.remove----------------------');
        console.log(this.state.connections.remove);
        console.log('----------------------');
        this.state.connections.remove(connection._id);
        this.state.currentConnection = new Connection();
        this.trigger(this.state);
      }
    });
  },

  /**
   * Change the SSH tunnel method.
   *
   * @param {String} tunnel - The method.
   */
  onSSHTunnelChanged(tunnel) {
    this._clearSSHTunnelFields();
    this.state.currentConnection.sshTunnel = tunnel;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel password.
   *
   * @param {String} password - The password.
   */
  onSSHTunnelPasswordChanged(password) {
    this.state.currentConnection.sshTunnelPassword = password;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel passphrase.
   *
   * @param {String} passphrase - The passphrase.
   */
  onSSHTunnelPassphraseChanged(passphrase) {
    this.state.currentConnection.sshTunnelPassphrase = passphrase;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel hostname.
   *
   * @param {String} hostname - The hostname.
   */
  onSSHTunnelHostnameChanged(hostname) {
    this.state.currentConnection.sshTunnelHostname = hostname;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel username.
   *
   * @param {String} username - The username.
   */
  onSSHTunnelUsernameChanged(username) {
    this.state.currentConnection.sshTunnelUsername = username;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel port.
   *
   * @param {String} port - The port.
   */
  onSSHTunnelPortChanged(port) {
    this.state.currentConnection.sshTunnelPort = port;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel identity file.
   *
   * @param {Array} files - The file.
   */
  onSSHTunnelIdentityFileChanged(files) {
    this.state.currentConnection.sshTunnelIdentityFile = files;
    this.trigger(this.state);
  },

  /**
   * Save a connection.
   *
   * @param {Connection} connection - The connection.
   */
  onSaveConnection(connection) {
    connection.save({
      success: () => {
        this.trigger(this.state);
      }
    });
  },

  /**
   * Connect to the current connection. Will validate the connection first,
   * then will attempt to connect. If connection is successful then a new
   * recent connection is created.
   */
  onConnect() {
    const connection = this.state.currentConnection;

    if (!connection.isValid()) {
      this.setState({ isValid: false });
    } else {
      this.StatusActions.showIndeterminateProgressBar();
      this.updateDefaults();
      this.dataService = new DataService(connection);
      this.appRegistry.emit('data-service-initialized', this.dataService);
      this.dataService.connect((err, ds) => {
        if (err) {
          this.StatusActions.done();
          return this.setState({ isValid: false, errorMessage: err.message });
        }

        // @note: onCreateRecent will handle the store triggering, no need to do
        //   it twice.
        this.state.isValid = true;
        this.state.isConnected = true;
        this.state.errorMessage = null;
        this.appRegistry.emit('data-service-connected', err, ds);
        this.onCreateRecent();
      });
    }
  },

  /**
   * Disconnect the current connection.
   */
  onDisconnect() {
    if (this.dataService) {
      this.dataService.disconnect(() => {
        this.appRegistry.emit('data-service-disconnected');
        this.setState({ isConnected: false, errorMessage: null, isValid: true });
        this.dataService = undefined;
      });
    }
  },

  /**
   * Create an Atlas cluster.
   */
  onVisitAtlasLink() {
    shell.openExternal(ATLAS_LINK);
    this.appRegistry.emit('create-atlas-cluster-clicked');
  },

  /**
   * Learn more about Atlas.
   */
  onAtlasLearnMore() {
    shell.openExternal(LEARN_MORE);
    this.appRegistry.emit('create-atlas-cluster-learn-more-clicked');
  },

  /**
   * Update default values for the connection depending on the authentication strategy
   * method and database values.
   *
   * @todo: Add tests for this.
   */
  updateDefaults() {
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
   * Get the initial state of the store.
   *
   * @returns {Object} The state.
   */
  getInitialState() {
    return {
      currentConnection: new Connection(),
      connections: new ConnectionCollection(),
      isValid: true,
      isConnected: false,
      errorMessage: null
    };
  },

  _addConnection(connection) {
    this.state.connections.add(connection);
    connection.save();
    this.trigger(this.state);
  },

  _clearAuthFields() {
    AUTH_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  _clearSSLFields() {
    SSL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  _clearSSHTunnelFields() {
    SSH_TUNNEL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

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
  }
});

module.exports = Store;
module.exports.EXTENSION = EXTENSION;
