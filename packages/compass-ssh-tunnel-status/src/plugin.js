import React, { Component } from 'react';
import { StoreConnector } from 'hadron-react-components';
import SshTunnelStatus from 'components/ssh-tunnel-status';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'SshTunnelStatusPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={store}>
        <SshTunnelStatus {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
