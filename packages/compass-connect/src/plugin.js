import React from 'react';
import { StoreConnector } from 'hadron-react-components';
import ConnectComponent from 'components/connect';
import ConnectStore from 'stores';

class Plugin extends React.Component {
  static displayName = 'ConnectPlugin';

  /**
   * Connect DeploymentAwarenessComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={ConnectStore}>
        <ConnectComponent {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
