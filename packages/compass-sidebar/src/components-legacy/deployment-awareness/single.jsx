import React from 'react';
import PropTypes from 'prop-types';
import { ServerType } from 'mongodb-instance-model';
import classnames from 'classnames';

import styles from './single.module.less';

/**
 * The single component.
 */
class Single extends React.Component {
  static displayName = 'Single';

  static propTypes = {
    server: PropTypes.object.isRequired,
    isDataLake: PropTypes.bool.isRequired,
  };

  /**
   * Render the cluster info.
   *
   * @returns {Component} The cluster info.
   */
  renderCluster() {
    return (
      <div className={classnames(styles['topology-single-cluster'])}>
        <div className={classnames(styles['topology-single-cluster-title'])}>
          CLUSTER
        </div>
        <div
          className={classnames(styles['topology-single-cluster-type'])}
          data-testid="topology-single-cluster-type"
        >
          {ServerType.humanize(this.props.server.type)}
        </div>
      </div>
    );
  }

  /**
   * Render single component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-single'])}>
        <div className={classnames(styles['topology-single-host'])}>
          <div className={classnames(styles['topology-single-host-title'])}>
            HOST
          </div>
          <div
            className={classnames(styles['topology-single-host-address'])}
            data-testid="topology-single-host-address"
            title={this.props.server.address}
          >
            {this.props.server.address}
          </div>
        </div>
        {this.props.isDataLake ? null : this.renderCluster()}
      </div>
    );
  }
}

export default Single;
