import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './collection-stats-item.module.less';

/**
 * The base class.
 */
const BASE_CLASS = 'collection-stats-item';

/**
 * The primary label class.
 */
const PRIMARY_LABEL = `${BASE_CLASS}-primary-label`;

/**
 * The primary value class.
 */
const PRIMARY_VALUE = `${BASE_CLASS}-primary-value`;

/**
 * The label class.
 */
const LABEL = `${BASE_CLASS}-label`;

/**
 * The value class.
 */
const VALUE = `${BASE_CLASS}-value`;

/**
 * Component for a single collection stats item.
 */
class CollectionStatsItem extends Component {
  static displayName = 'CollectionStatsItemComponent';

  static propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    primary: PropTypes.bool,
    'data-test-id': PropTypes.string
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles[BASE_CLASS]}>
        <div className={styles[this.props.primary ? PRIMARY_LABEL : LABEL]} data-test-id={`${this.props['data-test-id']}-label`}>
          {this.props.label}
        </div>
        <div className={styles[this.props.primary ? PRIMARY_VALUE : VALUE]} data-test-id={`${this.props['data-test-id']}-value`}>
          {this.props.value}
        </div>
      </div>
    );
  }
}

export default CollectionStatsItem;
export { CollectionStatsItem };
