const React = require('react');
const PropTypes = require('prop-types');
const { Popover, OverlayTrigger, Button } = require('react-bootstrap');
const DeploymentAwarenessActions = require('../actions');

const BASE_CLASS = 'deploymeny-awareness';
const SERVER_CLASS = `${BASE_CLASS}-server`;
const SET_NAME_CLASS = `${BASE_CLASS}-set-name`;
const BUTTON_CLASS = `${BASE_CLASS}-button`;
const ADDRESS_CLASS = `${SERVER_CLASS}-address`
const SERVERS_ID = `${BASE_CLASS}-servers`;

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
    const servers = this.props.servers.map((server, i) => {
      return (
        <div className={SERVER_CLASS} key={i}>
          <span>
            <i className={`mms-icon-${SERVER_TYPES[server.type]}`} />
          </span>
          <span className={ADDRESS_CLASS}>{server.address}</span>
        </div>
      );
    });
    return (
      <Popover id={SERVERS_ID}>
        {servers}
      </Popover>
    );
  }

  /**
   * Render the replica set name.
   *
   * @returns {React.Component} The rendered component.
   */
  renderSetName() {
    if (this.props.setName) {
      return (
        <span className={SET_NAME_CLASS}>{this.props.setName}</span>
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
      <div className={BASE_CLASS}>
        <OverlayTrigger trigger="click" placement="bottom" overlay={this.renderServers()}>
          <Button className={BUTTON_CLASS}>
            <i className={`mms-icon-${TOPOLOGY_TYPES[this.props.topologyType]}`} />
            {this.renderSetName()}
          </Button>
        </OverlayTrigger>
      </div>
    );
  }
}

DeploymentAwarenessComponent.displayName = 'DeploymentAwarenessComponent';

module.exports = DeploymentAwarenessComponent;
