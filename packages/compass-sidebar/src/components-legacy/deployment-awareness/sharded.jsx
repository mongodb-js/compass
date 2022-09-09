import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './sharded.module.less';

/**
 * The sharded component.
 */
class Sharded extends React.Component {
  static displayName = 'Sharded';

  static propTypes = {
    servers: PropTypes.array.isRequired,
  };

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} Mongoses`;
    }
    return `${count} Mongos`;
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
          className={classnames(styles['topology-sharded-host-address'])}
          data-testid={`topology-sharded-host-address-${i}`}
          key={i}
          title={server.address}
        >
          {server.address}
        </div>
      );
    });
  }

  /**
   * Render the sharded component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-sharded'])}>
        <div className={classnames(styles['topology-sharded-host'])}>
          <div className={classnames(styles['topology-sharded-host-title'])}>
            {this.props.servers.length > 1 ? 'HOSTS' : 'HOST'}
          </div>
          {this.renderServers()}
        </div>
        <div className={classnames(styles['topology-sharded-cluster'])}>
          <div className={classnames(styles['topology-sharded-cluster-title'])}>
            CLUSTER
          </div>
          <div className={classnames(styles['topology-sharded-cluster-name'])}>
            Sharded
          </div>
          <div className={classnames(styles['topology-sharded-cluster-nodes'])}>
            {this.renderServerCount()}
          </div>
        </div>
      </div>
    );
  }
}

export default Sharded;
