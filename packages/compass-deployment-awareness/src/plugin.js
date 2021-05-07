import React from 'react';
import { StoreConnector } from 'hadron-react-components';
import DeploymentAwarenessComponent from 'components/deployment-awareness';
import Store from 'stores';
import Actions from 'actions';

class ConnectedDeploymentAwarenessComponent extends React.Component {
  static displayName = 'ConnectedDeploymentAwarenessComponent';

  /**
   * Connect DeploymentAwarenessComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <DeploymentAwarenessComponent actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

export default ConnectedDeploymentAwarenessComponent;
