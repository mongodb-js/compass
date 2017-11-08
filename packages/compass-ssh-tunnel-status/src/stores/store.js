import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';

/**
 * Host string max length.
 */
const HOST_STRING_LENGTH = 25;

/**
 * Ssh Tunnel Status store.
 */
const SshTunnelStatusStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * On activatetd listen to the connection.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', this.onConnected.bind(this));
  },

  /**
   * when connected to a deployment, checks if the connection is via an ssh
   * tunnel, and if so, extracts hostname and port from the connection model
   * and sets the new state.
   */
  onConnected(err, ds) {
    if (err) return;
    const sshTunnel = ds.client.model.ssh_tunnel !== 'NONE';
    const sshTunnelHostname = sshTunnel ? ds.client.model.ssh_tunnel_hostname : '';
    const sshTunnelPort = sshTunnel ? ds.client.model.ssh_tunnel_options.dstPort : '';
    const sshTunnelHostPortString = sshTunnel ? this._combineHostPort(
      sshTunnelHostname, sshTunnelPort, true) : '';

    this.setState({
      sshTunnel,
      sshTunnelHostname,
      sshTunnelPort,
      sshTunnelHostPortString
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
   * Initialize the Server Version store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      sshTunnel: false,
      sshTunnelHostname: '',
      sshTunnelPort: '',
      sshTunnelHostPortString: ''
    };
  }
});

export default SshTunnelStatusStore;
export { SshTunnelStatusStore };
