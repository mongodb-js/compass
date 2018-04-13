const Reflux = require('reflux');
const sortBy = require('lodash.sortby');
const isEmpty = require('lodash.isempty');
const forEach = require('lodash.foreach');
const DataService = require('mongodb-data-service');
const Actions = require('../actions');
const Connection = require('../models/connection');
const ConnectionCollection = require('../models/connection-collection');
const StateMixin = require('reflux-state-mixin');
const ipc = require('hadron-ipc');
const { shell } = require('electron');

/**
 * All the authentication related fields on the connection model, with
 * the exception of the method.
 */
const AUTH_FIELDS = [
  'mongodb_username',
  'mongodb_password',
  'mongodb_database_name',
  'kerberos_principal',
  'kerberos_password',
  'kerberos_service_name',
  'x509_username',
  'ldap_username',
  'ldap_password'
];

/**
 * All the SSL related fields on the connection model, with the exception
 * of the method.
 */
const SSL_FIELDS = [
  'ssl_ca',
  'ssl_certificate',
  'ssl_private_key',
  'ssl_private_key_password'
];

/**
 * All the ssh tunnel related fields on the connection model, with the
 * exception of the method.
 */
const SSH_TUNNEL_FIELDS = [
  'ssh_tunnel_hostname',
  'ssh_tunnel_port',
  'ssh_tunnel_bind_to_local_port',
  'ssh_tunnel_username',
  'ssh_tunnel_password',
  'ssh_tunnel_identity_file',
  'ssh_tunnel_passphrase',
  'replica_set_name'
];

/**
 * The role name for plugin extensions.
 */
const EXTENSION = 'Connect.Extension';

/**
 * Atlas link.
 */
const ATLAS_LINK = 'https://cloud.mongodb.com/user#/atlas/register/accountProfile';

/**
 * The store that backs the connect plugin.
 */
const ConnectStore = Reflux.createStore({
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
   * Changes the auth method.
   *
   * @param {String} method - The auth method.
   */
  onAuthenticationMethodChanged(method) {
    this._clearAuthFields();
    this.state.currentConnection.authentication = method;
    this.trigger(this.state);
  },

  /**
   * Changes the username.
   *
   * @param {String} username - The username.
   */
  onUsernameChanged(username) {
    this.state.currentConnection.mongodb_username = username;
    this.trigger(this.state);
  },

  /**
   * Changes the password.
   *
   * @param {String} password - The password.
   */
  onPasswordChanged(password) {
    this.state.currentConnection.mongodb_password = password;
    this.trigger(this.state);
  },

  /**
   * Changes the auth source.
   *
   * @param {String} authSource - The auth source.
   */
  onAuthSourceChanged(authSource) {
    this.state.currentConnection.mongodb_database_name = authSource;
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
      this.state.currentConnection.ssl = 'SYSTEMCA';
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
    this.state.currentConnection.read_preference = readPreference;
    this.trigger(this.state);
  },

  /**
   * Change the replica set name.
   *
   * @param {String} replicaSetName - The replica set name.
   */
  onReplicaSetNameChanged(replicaSetName) {
    this.state.currentConnection.replica_set_name = replicaSetName.trim();
    this.trigger(this.state);
  },

  /**
   * Change the SSL method.
   *
   * @param {String} method - The SSL method.
   */
  onSSLMethodChanged(method) {
    this._clearSSLFields();
    this.state.currentConnection.ssl = method;
    this.trigger(this.state);
  },

  /**
   * Change the SSL ca.
   *
   * @param {Array} files - The files.
   */
  onSSLCAChanged(files) {
    this.state.currentConnection.ssl_ca = files;
    this.trigger(this.state);
  },

  /**
   * Change the SSL certificate.
   *
   * @param {Array} files - The files.
   */
  onSSLCertificateChanged(files) {
    this.state.currentConnection.ssl_certificate = files;
    this.trigger(this.state);
  },

  /**
   * Change the SSL private key.
   *
   * @param {Array} files - The files.
   */
  onSSLPrivateKeyChanged(files) {
    this.state.currentConnection.ssl_private_key = files;
    this.trigger(this.state);
  },

  /**
   * Change the SSL password.
   *
   * @param {String} password - The password.
   */
  onSSLPrivateKeyPasswordChanged(password) {
    this.state.currentConnection.ssl_private_key_password = password;
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
    connection.is_favorite = true;
    this._addConnection(connection);
  },

  /**
   * Create a recent connection from the current connection.
   */
  onCreateRecent() {
    const connection = this.state.currentConnection;
    connection.last_used = new Date();
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
   * Delete a connection.
   *
   * @param {Connection} connection - The connection to delete.
   */
  onDeleteConnection(connection) {
    connection.destroy({
      success: () => {
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
    this.state.currentConnection.ssh_tunnel = tunnel;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel password.
   *
   * @param {String} password - The password.
   */
  onSSHTunnelPasswordChanged(password) {
    this.state.currentConnection.ssh_tunnel_password = password;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel passphrase.
   *
   * @param {String} passphrase - The passphrase.
   */
  onSSHTunnelPassphraseChanged(passphrase) {
    this.state.currentConnection.ssh_tunnel_passphrase = passphrase;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel hostname.
   *
   * @param {String} hostname - The hostname.
   */
  onSSHTunnelHostnameChanged(hostname) {
    this.state.currentConnection.ssh_tunnel_hostname = hostname;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel username.
   *
   * @param {String} username - The username.
   */
  onSSHTunnelUsernameChanged(username) {
    this.state.currentConnection.ssh_tunnel_username = username;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel port.
   *
   * @param {String} port - The port.
   */
  onSSHTunnelPortChanged(port) {
    this.state.currentConnection.ssh_tunnel_port = port;
    this.trigger(this.state);
  },

  /**
   * Change the SSH tunnel identity file.
   *
   * @param {Array} files - The file.
   */
  onSSHTunnelIdentityFileChanged(files) {
    this.state.currentConnection.ssh_tunnel_identity_file = files;
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
      this.dataService.disconnect();
      this.dataService = undefined;
    }
    this.setState({ isConnected: false, errorMessage: null, isValid: true });
    this.appRegistry.emit('data-service-disconnected');
  },

  /**
   * Create an Atlas cluster.
   */
  onVisitAtlasLink() {
    shell.openExternal(ATLAS_LINK);
    this.appRegistry.emit('create-atlas-cluster-clicked');
  },

  /**
   * Update default values for the connection depending on the authentication
   * method and database values.
   *
   * @todo: Add tests for this.
   */
  updateDefaults() {
    const connection = this.state.currentConnection;
    if (connection.authentication === 'MONGODB' && isEmpty(connection.mongodb_database_name)) {
      connection.mongodb_database_name = 'admin';
    } else if (connection.authentication === 'KERBEROS' && isEmpty(connection.kerberos_service_name)) {
      connection.kerberos_service_name = 'mongodb';
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

  _pruneRecents(done) {
    const recents = this.state.connections.filter((connection) => {
      return !connection.is_favorite;
    });
    if (recents.length === 10) {
      const sortedRecents = sortBy(recents, 'last_used');
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

module.exports = ConnectStore;
module.exports.EXTENSION = EXTENSION;
