import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CollectionStatsItem from '../collection-stats-item';

import styles from './index-stats-item.module.less';

/**
 * The list class.
 */
const LIST_CLASS = 'index-stats-item';

/**
 * Indexes constant.
 */
const INDEXES = 'Indexes';

/**
 * Total size constant.
 */
const TOTAL_SIZE = 'total size';

/**
 * Average size constant.
 */
const AVG_SIZE = 'avg. size';

/**
 * The index stats item component.
 */
class IndexStatsItem extends Component {
  static displayName = 'IndexesStatsItem';

  static propTypes = {
    indexCount: PropTypes.string.isRequired,
    totalIndexSize: PropTypes.string.isRequired,
    avgIndexSize: PropTypes.string.isRequired
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   *
   */
  render() {
    return (
      <div data-testid="index-stats-item" className={styles[LIST_CLASS]}>
        <CollectionStatsItem dataTestId="index-count" label={INDEXES} value={this.props.indexCount} primary />
        <CollectionStatsItem dataTestId="total-index-size" label={TOTAL_SIZE} value={this.props.totalIndexSize} />
        <CollectionStatsItem dataTestId="avg-index-size" label={AVG_SIZE} value={this.props.avgIndexSize} />
      </div>
    );
  }
}

export default IndexStatsItem;
export { IndexStatsItem };
