import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './unknown.less';

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
      return `${count} servers`;
    }
    return `${count} server`;
  }

  renderPill() {
    return (
      <div className={classnames(styles['topology-unknown-type'])}>
        <i className="mms-icon-unknown" />
        <span className={classnames(styles['topology-unknown-type-name'])}>Unknown</span>
      </div>
    );
  }

  /**
   * Render the unknown component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['topology-unknown'])}>
        <div className={classnames(styles['topology-unknown-name'])}>
          Unknown
        </div>
        { this.props.isDataLake ? null : this.renderPill() }
        <div className={classnames(styles['topology-unknown-nodes'])}>
          {this.renderServerCount()}
        </div>
      </div>
    );
  }
}

export default Unknown;
