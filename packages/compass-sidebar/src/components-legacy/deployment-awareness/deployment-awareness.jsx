import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TopologyType } from 'mongodb-instance-model';
import Single from './single';
import Sharded from './sharded';
import ReplicaSet from './replica-set';
import LoadBalanced from './load-balanced';
import Unknown from './unknown';

import styles from './deployment-awareness.module.less';

/**
 * The deployment awareness component.
 */
class DeploymentAwarenessComponent extends React.Component {
  static displayName = 'DeploymentAwarenessComponent';

  static propTypes = {
    servers: PropTypes.array,
    setName: PropTypes.string,
    topologyType: PropTypes.string,
    isDataLake: PropTypes.bool,
  };

  /**
   * Renders the topology information.
   *
   * @returns {React.Component} The component.
   */
  renderTopologyInfo() {
    switch (this.props.topologyType) {
      case TopologyType.SINGLE:
        return (
          <Single
            server={this.props.servers[0]}
            isDataLake={this.props.isDataLake}
          />
        );
      case TopologyType.SHARDED:
        return <Sharded servers={this.props.servers} />;
      case TopologyType.REPLICA_SET_NO_PRIMARY:
        return <ReplicaSet {...this.props} />;
      case TopologyType.REPLICA_SET_WITH_PRIMARY:
        return <ReplicaSet {...this.props} />;
      case TopologyType.LOAD_BALANCED:
        return <LoadBalanced server={this.props.servers[0]} />;
      default:
        return (
          <Unknown
            servers={this.props.servers}
            isDataLake={this.props.isDataLake}
          />
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
      <div
        className={classnames(styles['deployment-awareness'])}
        data-testid="deployment-awareness"
      >
        {this.renderTopologyInfo()}
      </div>
    );
  }
}

export default DeploymentAwarenessComponent;
