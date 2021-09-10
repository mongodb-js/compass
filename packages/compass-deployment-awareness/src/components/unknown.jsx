import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './unknown.module.less';

/**
 * The unknown component.
 */
class Unknown extends React.Component {
  static displayName = 'Unknown';

  static propTypes = {
    servers: PropTypes.array.isRequired,
    isDataLake: PropTypes.bool.isRequired
  }

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} Servers`;
    }
    return `${count} Server`;
  }

  /**
   * Render the cluster info.
   *
   * @returns {Component} The cluster info.
   */
  renderCluster() {
    return (
      <div className={classnames(styles['topology-unknown-cluster'])}>
        <div className={classnames(styles['topology-unknown-cluster-title'])}>
          CLUSTER
        </div>
        <div className={classnames(styles['topology-unknown-cluster-type'])}>
          Unknown
        </div>
        <div className={classnames(styles['topology-unknown-cluster-nodes'])}>
          {this.renderServerCount()}
        </div>
      </div>
    );
  }

  /**
   * Renders the server list.
   *
   * @returns {Array} The server list.
   */
  renderServers() {
    return this.props.servers.map((server, i) => {
      return (
        <div className={classnames(styles['topology-unknown-host-address'])} key={i}>
          {server.address}
        </div>
      );
    });
  }

  /**
   * Render the unknown component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-unknown'])}>
        <div className={classnames(styles['topology-unknown-host'])}>
          <div className={classnames(styles['topology-unknown-host-title'])}>
            {this.props.servers.length > 1 ? 'HOSTS' : 'HOST'}
          </div>
          {this.renderServers()}
        </div>
        { this.props.isDataLake ? null : this.renderCluster() }
      </div>
    );
  }
}

export default Unknown;
