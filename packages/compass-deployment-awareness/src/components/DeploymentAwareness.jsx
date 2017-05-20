const React = require('react');
const PropTypes = require('prop-types');
const DeploymentAwarenessActions = require('../actions');

/**
 * Topology types to class name mappings.
 */
const TOPOLOGY_TYPES = {
  'Standalone': 'standalone',
  'ReplicaSetNoPrimary': 'replica-set',
  'ReplicaSetWithPrimary': 'replica-set',
  'Sharded': 'cluster',
  'Unknown': 'unknown'
};

/**
 * Server types to class name mappings.
 */
const SERVER_TYPES = {
  'Standalone': 'primary',
  'Mongos': 'primary',
  'PossiblePrimary': 'primary',
  'RSPrimary': 'primary',
  'RSSecondary': 'secondary',
  'RSArbiter': 'arbiter',
  'RSOther': 'nostate',
  'RSGhost': 'nostate',
  'Unknown': 'nostate',
};

/**
 * <i class="mms-icon-leaf"> For version.
 */
class DeploymentAwarenessComponent extends React.Component {

  /**
   * Render the servers that are connected to.
   *
   * @returns {React.Component} The rendered component.
   */
  renderServers() {
    return this.props.servers.map((server, i) => {
      return (
        <div className="deployment-awareness-server" key={i}>
          <i className={`mms-icon-${SERVER_TYPES[server.type]}`} />
          <span className="deployment-awareness-server-address">{server.address}</span>
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
        <span className="deployment-awareness-set-name">{this.props.setName}</span>
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
          <i className={`mms-icon-${TOPOLOGY_TYPES[this.props.topologyType]}`} />
          {this.renderSetName()}
        </div>
        {this.renderServers()}
      </div>
    );
  }
}

DeploymentAwarenessComponent.displayName = 'DeploymentAwarenessComponent';

module.exports = DeploymentAwarenessComponent;
