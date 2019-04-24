import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './replica-set.less';

/**
 * The replica-set component.
 */
class ReplicaSet extends React.Component {
  static displayName = 'ReplicaSet';

  static propTypes = {
    servers: PropTypes.array.isRequired,
    setName: PropTypes.string.isRequired,
    topologyType: PropTypes.string.isRequired
  }

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} nodes`;
    }
    return `${count} node`;
  }

  /**
   * Render the replica-set component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-replica-set'])}>
        <div className={classnames(styles['topology-replica-set-name'])}>
          {this.props.setName}
        </div>
        <div className={classnames(styles['topology-replica-set-type'])}>
          <i className="mms-icon-replica-set" />
          <span className={classnames(styles['topology-replica-set-type-name'])}>Replica Set</span>
        </div>
        <div className={classnames(styles['topology-replica-set-nodes'])}>
          {this.renderServerCount()}
        </div>
      </div>
    );
  }
}

export default ReplicaSet;
