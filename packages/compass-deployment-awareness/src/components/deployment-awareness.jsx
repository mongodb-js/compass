const React = require('react');
const PropTypes = require('prop-types');
const TopologyType = require('../models/topology-type');

const BASE_CLASS = 'topology';

/**
 * Topology types to class name mappings.
 */
const TOPOLOGY_TYPES = {
  'Single': 'single',
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
  'Unknown': 'nostate'
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
        <tr key={i}>
          <td className="topology-servers-type">
            <i className={`mms-icon-${SERVER_TYPES[server.type]}`} />
          </td>
          <td>
            {server.address}
          </td>
        </tr>
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
        <span className="topology-type-set-name">({this.props.setName})</span>
      );
    }
  }

  renderTopologyType() {
    return (
      <div className="topology-type-name">
        <i className={`mms-icon-${TOPOLOGY_TYPES[this.props.topologyType]}`} />
        {TopologyType.humanize(this.props.topologyType)}
      </div>
    );
  }

  /**
   * Render the name of the deployment.
   *
   * @returns {String} The name.
   */
  renderName() {
    if (this.props.setName) {
      return this.props.setName;
    } else if (this.props.topologyType === TopologyType.SINGLE) {
      return this.props.servers[0].type;
    }
    return this.props.topologyType;
  }

  renderNodes() {
    const length = this.props.servers.length;
    return `${length} Node${length === 1 ? '' : 's'}`;
  }

  /**
   * Render DeploymentAwareness component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={BASE_CLASS}>
        <div className="action-bar"></div>
        <div className="topology-name">
          {this.renderName()}
        </div>
        <div className="topology-type">
          {this.renderTopologyType()}
        </div>
        <div className="topology-server-count">
          {this.renderNodes()}
        </div>
        <div className="topology-servers">
          <table>
            {this.renderServers()}
          </table>
        </div>
      </div>
    );
  }
}

DeploymentAwarenessComponent.propTypes = {
  servers: PropTypes.array,
  setName: PropTypes.string,
  topologyType: PropTypes.string.isRequired
};

DeploymentAwarenessComponent.displayName = 'DeploymentAwarenessComponent';

module.exports = DeploymentAwarenessComponent;
