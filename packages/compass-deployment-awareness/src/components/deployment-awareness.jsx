const React = require('react');
const PropTypes = require('prop-types');
const TopologyType = require('../models/topology-type');
const Single = require('./single');
const Sharded = require('./sharded');
const ReplicaSet = require('./replica-set');
const Unknown = require('./unknown');

/**
 * The deployment awareness component.
 */
class DeploymentAwarenessComponent extends React.Component {

  /**
   * Renders the topology information.
   *
   * @returns {React.Component} The component.
   */
  renderTopologyInfo() {
    switch (this.props.topologyType) {
      case TopologyType.SINGLE:
        return (<Single server={this.props.servers[0]} />);
      case TopologyType.SHARDED:
        return (<Sharded servers={this.props.servers} />);
      case TopologyType.REPLICA_SET_NO_PRIMARY:
      case TopologyType.REPLICA_SET_WITH_PRIMARY:
        return (<ReplicaSet {...this.props} />);
      default:
        return (<Unknown servers={this.props.servers} />);
    }
  }

  /**
   * Render DeploymentAwareness component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="topology">
        {this.renderTopologyInfo()}
      </div>
    );
  }
}

DeploymentAwarenessComponent.propTypes = {
  servers: PropTypes.array,
  setName: PropTypes.string,
  topologyType: PropTypes.string
};

DeploymentAwarenessComponent.displayName = 'DeploymentAwarenessComponent';

module.exports = DeploymentAwarenessComponent;
