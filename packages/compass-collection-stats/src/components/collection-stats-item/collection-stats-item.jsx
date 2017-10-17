import classnames from 'classnames';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './collection-stats-item.less';

/**
 * Component for a single collection stats item.
 */
class CollectionStatsItem extends Component {
  static displayName = 'CollectionStatsItem';

  static propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    primary: PropTypes.bool
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const labelClassName = classnames(
      styles.label,
      {[styles['label-primary']]: this.props.primary}
    );
    const valueClassName = classnames(
      styles.value,
      {[styles['value-primary']]: this.props.primary}
    );

    return (
      <li className={styles.component}>
        <div className={labelClassName}>
          {this.props.label}
        </div>
        <div className={valueClassName}>
          {this.props.value}
        </div>
      </li>
    );
  }
}

export default CollectionStatsItem;
export { CollectionStatsItem };
