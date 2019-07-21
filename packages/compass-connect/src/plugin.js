import React from 'react';
import { StoreConnector } from 'hadron-react-components';
import Connect from 'components/connect';
import Store from 'stores';

class Plugin extends React.Component {
  static displayName = 'ConnectPlugin';

  /**
   * Connect DeploymentAwarenessComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Connect {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
