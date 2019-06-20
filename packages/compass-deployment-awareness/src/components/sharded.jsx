import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './sharded.less';

/**
 * The sharded component.
 */
class Sharded extends React.Component {
  static displayName = 'Sharded';

  static propTypes = {
    servers: PropTypes.array.isRequired
  }

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} mongoses`;
    }
    return `${count} mongos`;
  }

  /**
   * Render the sharded component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-sharded'])}>
        <div className={classnames(styles['topology-sharded-type'])}>
          <i className="mms-icon-cluster" />
          <span className={classnames(styles['topology-sharded-type-name'])}>Sharded Cluster</span>
        </div>
        <div className={classnames(styles['topology-sharded-mongos'])}>
          {this.renderServerCount()}
        </div>
      </div>
    );
  }
}

export default Sharded;
