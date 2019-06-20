import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  SINGLE,
  SHARDED,
  REPLICA_SET_NO_PRIMARY,
  REPLICA_SET_WITH_PRIMARY
} from 'models/topology-type';
import Single from 'components/single';
import Sharded from 'components/sharded';
import ReplicaSet from 'components/replica-set';
import Unknown from 'components/unknown';

import styles from './deployment-awareness.less';

/**
 * The deployment awareness component.
 */
class DeploymentAwarenessComponent extends React.Component {
  static displayName = 'DeploymentAwarenessComponent';

  static propTypes = {
    servers: PropTypes.array,
    setName: PropTypes.string,
    topologyType: PropTypes.string,
    isDataLake: PropTypes.bool
  }

  /**
   * Renders the topology information.
   *
   * @returns {React.Component} The component.
   */
  renderTopologyInfo() {
    switch (this.props.topologyType) {
      case SINGLE:
        return (<Single server={this.props.servers[0]} isDataLake={this.props.isDataLake}/>);
      case SHARDED:
        return (<Sharded servers={this.props.servers} />);
      case REPLICA_SET_NO_PRIMARY:
        return (<ReplicaSet {...this.props} />);
      case REPLICA_SET_WITH_PRIMARY:
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
      <div className={classnames(styles['deployment-awareness'])}>
        {this.renderTopologyInfo()}
      </div>
    );
  }
}

export default DeploymentAwarenessComponent;
