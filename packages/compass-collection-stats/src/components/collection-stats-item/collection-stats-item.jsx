import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collection-stats-item.less';

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
    primary: PropTypes.bool
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles[BASE_CLASS])}>
        <div className={classnames(styles[this.props.primary ? PRIMARY_LABEL : LABEL])}>
          {this.props.label}
        </div>
        <div className={classnames(styles[this.props.primary ? PRIMARY_VALUE : VALUE])}>
          {this.props.value}
        </div>
      </div>
    );
  }
}

export default CollectionStatsItem;
export { CollectionStatsItem };
