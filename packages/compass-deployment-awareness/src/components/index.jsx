const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const DeploymentAwarenessComponent = require('./deployment-awareness');
const Store = require('../stores');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:deployment-awareness:index');

class ConnectedDeploymentAwarenessComponent extends React.Component {
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

ConnectedDeploymentAwarenessComponent.displayName = 'ConnectedDeploymentAwarenessComponent';

module.exports = ConnectedDeploymentAwarenessComponent;
