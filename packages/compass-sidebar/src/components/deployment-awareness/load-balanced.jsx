import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './load-balanced.module.less';

/**
 * The unknown component.
 */
class LoadBalanced extends React.Component {
  static displayName = 'Using Load Balancer';

  static propTypes = {
    server: PropTypes.object.isRequired,
  };

  /**
   * Render the load balanced component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-load-balanced'])}>
        <div className={classnames(styles['topology-load-balanced-host'])}>
          <div
            className={classnames(styles['topology-load-balanced-host-title'])}
          >
            HOST (Load Balancer)
          </div>
          {this.props.server.address}
        </div>
      </div>
    );
  }
}

export default LoadBalanced;
