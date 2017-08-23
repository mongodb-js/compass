const Reflux = require('reflux');
const Actions = require('../actions');
const Connection = require('../models/connection');
const ConnectionCollection = require('../models/connection-collection');
const StateMixin = require('reflux-state-mixin');

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
    this.setState({ currentConnection: new Connection() });
  },

  onAuthenticationMethodChanged(method) {
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
    this.state.connections.add(connection);
    connection.save();
    this.trigger(this.state);
  },

  onFavoriteSelected(favorite) {
    this.setState({ currentConnection: favorite });
  },

  onDeleteConnection(connection) {
    connection.destroy({
      success: () => {
        this.state.connections.remove(connection._id);
        this.trigger(this.state);
      }
    });
  },

  onSSHTunnelChanged(tunnel) {
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

  getInitialState() {
    return {
      currentConnection: new Connection(),
      connections: new ConnectionCollection()
    };
  }
});

module.exports = ConnectStore;
