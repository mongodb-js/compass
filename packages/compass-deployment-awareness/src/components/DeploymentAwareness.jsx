const React = require('react');
const PropTypes = require('prop-types');
const DeploymentAwarenessActions = require('../actions');
const ToggleButton = require('./toggle-button');

class DeploymentAwarenessComponent extends React.Component {

  /**
   * Render the servers that are connected to.
   *
   * @returns {React.Component} The rendered component.
   */
  renderServers() {
    return this.props.servers.map((server, i) => {
      return (
        <div className="deployment-awareness-servers" key={i}>
          {server.type}/{server.address}
        </div>
      );
    });
  }

  /**
   * Render the replica set name.
   *
   * @returns {React.Component} The rendered component.
   */
  renderSetName() {
    if (this.props.setName) {
      return (
        <div className="deployment-awareness-set-name">
          {this.props.setName}
        </div>
      );
    }
  }

  /**
   * Render DeploymentAwareness component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="deployment-awareness">
        <div className="deployment-awareness-topology-type">
          {this.props.topologyType}
        </div>
        {this.renderSetName()}
        {this.renderServers()}
      </div>
    );
  }
}

DeploymentAwarenessComponent.displayName = 'DeploymentAwarenessComponent';

module.exports = DeploymentAwarenessComponent;
