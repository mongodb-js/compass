const Reflux = require('reflux');
const sortBy = require('lodash.sortby');
const isEmpty = require('lodash.isempty');
const DataService = require('mongodb-data-service');
const Actions = require('../actions');
const Connection = require('../models/connection');
const ConnectionCollection = require('../models/connection-collection');
const StateMixin = require('reflux-state-mixin');

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
  'ssh_tunnel_passphrase'
];

/**
 * The store that backs the connect plugin.
 */
const ConnectStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  init() {
    this.state.connections.fetch({
      success: () => {
        this.trigger(this.state);
      }
    });
  },

  resetConnection() {
    this.setState({ currentConnection: new Connection(), isValid: true });
  },

  onAuthenticationMethodChanged(method) {
    this._clearAuthFields();
    this.state.currentConnection.authentication = method;
    this.trigger(this.state);
  },

  onUsernameChanged(username) {
    this.state.currentConnection.mongodb_username = username;
    this.trigger(this.state);
  },

  onPasswordChanged(password) {
    this.state.currentConnection.mongodb_password = password;
    this.trigger(this.state);
  },

  onAuthSourceChanged(authSource) {
    this.state.currentConnection.mongodb_database_name = authSource;
    this.trigger(this.state);
  },

  onHostnameChanged(hostname) {
    this.state.currentConnection.hostname = hostname;
    if (hostname.match(/mongodb\.net/i)) {
      this.state.currentConnection.ssl = 'SYSTEMCA';
    }
    this.trigger(this.state);
  },

  onPortChanged(port) {
    this.state.currentConnection.port = port;
    this.trigger(this.state);
  },

  onReadPreferenceChanged(readPreference) {
    this.state.currentConnection.read_preference = readPreference;
    this.trigger(this.state);
  },

  onReplicaSetNameChanged(replicaSetName) {
    this.state.currentConnection.replica_set_name = replicaSetName;
    this.trigger(this.state);
  },

  onSSLMethodChanged(method) {
    this._clearSSLFields();
    this.state.currentConnection.ssl = method;
    this.trigger(this.state);
  },

  onSSLCAChanged(files) {
    this.state.currentConnection.ssl_ca = files;
    this.trigger(this.state);
  },

  onSSLCertificateChanged(files) {
    this.state.currentConnection.ssl_certificate = files;
    this.trigger(this.state);
  },

  onSSLPrivateKeyChanged(files) {
    this.state.currentConnection.ssl_private_key = files;
    this.trigger(this.state);
  },

  onSSLPrivateKeyPasswordChanged(password) {
    this.state.currentConnection.ssl_private_key_password = password;
    this.trigger(this.state);
  },

  onFavoriteNameChanged(name) {
    this.state.currentConnection.name = name;
    this.trigger(this.state);
  },

  onCreateFavorite() {
    const connection = this.state.currentConnection;
    connection.is_favorite = true;
    this._addConnection(connection);
  },

  onCreateRecent() {
    const connection = this.state.currentConnection;
    connection.last_used = new Date();
    this._pruneRecents(() => {
      this._addConnection(connection);
    });
  },

  onConnectionSelected(connection) {
    this.setState({ currentConnection: connection });
  },

  onDeleteConnection(connection) {
    connection.destroy({
      success: () => {
        this.state.connections.remove(connection._id);
        this.state.currentConnection = new Connection();
        this.trigger(this.state);
      }
    });
  },

  onSSHTunnelChanged(tunnel) {
    this._clearSSHTunnelFields();
    this.state.currentConnection.ssh_tunnel = tunnel;
    this.trigger(this.state);
  },

  onSSHTunnelPasswordChanged(password) {
    this.state.currentConnection.ssh_tunnel_password = password;
    this.trigger(this.state);
  },

  onSSHTunnelPassphraseChanged(passphrase) {
    this.state.currentConnection.ssh_tunnel_passphrase = passphrase;
    this.trigger(this.state);
  },

  onSSHTunnelHostnameChanged(hostname) {
    this.state.currentConnection.ssh_tunnel_hostname = hostname;
    this.trigger(this.state);
  },

  onSSHTunnelUsernameChanged(username) {
    this.state.currentConnection.ssh_tunnel_username = username;
    this.trigger(this.state);
  },

  onSSHTunnelPortChanged(port) {
    this.state.currentConnection.ssh_tunnel_port = port;
    this.trigger(this.state);
  },

  onSSHTunnelIdentityFileChanged(file) {
    this.state.currentConnection.ssh_tunnel_identity_file = file;
    this.trigger(this.state);
  },

  onSaveConnection(connection) {
    connection.save({
      success: () => {
        this.trigger(this.state);
      }
    });
  },

  onConnect() {
    const connection = this.state.currentConnection;
    if (!connection.isValid()) {
      this.setState({ isValid: false });
    } else {
      // @note: If using MONGODB auth and the auth source is empty, we
      //   default it to admin.
      if (connection.authentication === 'MONGODB' && isEmpty(connection.mongodb_database_name)) {
        connection.mongodb_database_name = 'admin';
      }
      const dataService = new DataService(connection);
      dataService.connect((err, ds) => {
        if (err) {
          return this.setState({ isValid: false, errorMessage: err.message });
        }
        global.hadronApp.appRegistry.onConnected(err, ds);
        // @note: onCreateRecent will handle the store triggering, no need to do
        //   it twice.
        this.state.isValid = true;
        this.state.isConnected = true;
        this.state.errorMessage = null;
        this.onCreateRecent();
      });
    }
  },

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
