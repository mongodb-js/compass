const app = require('hadron-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const SSHTunnelStatusAction = require('../actions');

const debug = require('debug')('mongodb-compass:stores:ssh-tunnel-status');

const HOST_STRING_LENGTH = 25;

/**
 * SSH Tunnel Status store.
 */
const SSHTunnelStatusStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [SSHTunnelStatusAction],

  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', this.onConnected.bind(this));
  },

  /**
   * when connected to a deployment, checks if the connection is via an ssh
   * tunnel, and if so, extracts hostname and port from the connection model
   * and sets the new state.
   */
  onConnected(err, ds) {
    const sshTunnel = ds.client.model.ssh_tunnel !== 'NONE';
    const sshTunnelHostname = sshTunnel ? ds.client.model.ssh_tunnel_hostname : '';
    const sshTunnelPort = sshTunnel ? ds.client.model.ssh_tunnel_options.dstPort : '';
    const sshTunnelHostPortString = sshTunnel ? this._combineHostPort(
      sshTunnelHostname, sshTunnelPort, true) : '';

    this.setState({
      sshTunnel, sshTunnelHostname, sshTunnelPort, sshTunnelHostPortString
    });
  },

  /**
   * Initialize the Server Version store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      sshTunnel: false,
      sshTunnelHostname: '',
      sshTunnelPort: '',
      sshTunnelHostPortString: '',
      truncated: true
    };
  },

  showFullHostPort() {
    const { sshTunnelHostname, sshTunnelPort } = this.state;
    this.setState({
      sshTunnelHostPortString: this._combineHostPort(sshTunnelHostname,
        sshTunnelPort, false)
    });
  },

  showTruncatedHostPort() {
    const { sshTunnelHostname, sshTunnelPort } = this.state;
    this.setState({
      sshTunnelHostPortString: this._combineHostPort(sshTunnelHostname,
        sshTunnelPort, true)
    });
  },

  /**
   * returns the combined host:port string, possibly truncated in the middle
   * of the host.
   * @param  {String} host       The hostname string
   * @param  {String} port       The port string
   * @param  {Boolean} truncate  Whether the string needs to be truncated
   *
   * @return {String}            The resulting host:port string
   */
  _combineHostPort(host, port, truncate) {
    if (host.length >= HOST_STRING_LENGTH && truncate) {
      return host.slice(0, 9) + '...' + host.slice(-9) + ':' + port;
    }
    return host + ':' + port;
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('ServerVersion store changed from', prevState, 'to', this.state);
  }
});

module.exports = SSHTunnelStatusStore;
