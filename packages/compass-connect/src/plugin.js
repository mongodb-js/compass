import React from 'react';
import { StoreConnector } from 'hadron-react-components';
import Connect from 'components/connect';
import Store from 'stores';
import Actions from 'actions';

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
        <Connect actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
