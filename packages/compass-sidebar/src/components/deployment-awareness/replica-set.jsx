import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './replica-set.module.less';

/**
 * The replica-set component.
 */
class ReplicaSet extends React.Component {
  static displayName = 'ReplicaSet';

  static propTypes = {
    servers: PropTypes.array.isRequired,
    setName: PropTypes.string.isRequired,
    topologyType: PropTypes.string.isRequired,
  };

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} Nodes`;
    }
    return `${count} Node`;
  }

  /**
   * Renders the server list.
   *
   * @returns {Array} The server list.
   */
  renderServers() {
    return this.props.servers.map((server, i) => {
      return (
        <div
          className={classnames(styles['topology-replica-set-host-address'])}
          data-test-id={`topology-replica-set-host-address-${i}`}
          key={i}
          title={server.address}
        >
          {server.address}
        </div>
      );
    });
  }

  /**
   * Render the replica-set component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-replica-set'])}>
        <div className={classnames(styles['topology-replica-set-host'])}>
          <div
            className={classnames(styles['topology-replica-set-host-title'])}
          >
            {this.props.servers.length > 1 ? 'HOSTS' : 'HOST'}
          </div>
          {this.renderServers()}
        </div>
        <div className={classnames(styles['topology-replica-set-cluster'])}>
          <div
            className={classnames(styles['topology-replica-set-cluster-title'])}
          >
            CLUSTER
          </div>
          <div
            className={classnames(styles['topology-replica-set-cluster-name'])}
            data-test-id="topology-replica-set-type"
          >
            Replica Set ({this.props.setName})
          </div>
          <div
            className={classnames(styles['topology-replica-set-cluster-nodes'])}
          >
            {this.renderServerCount()}
          </div>
        </div>
      </div>
    );
  }
}

export default ReplicaSet;
