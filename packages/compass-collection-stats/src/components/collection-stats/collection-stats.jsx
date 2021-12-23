import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DocumentStatsItem from '../document-stats-item';
import IndexStatsItem from '../index-stats-item';

import styles from './collection-stats.module.less';

class CollectionStats extends Component {
  static displayName = 'CollectionStatsComponent';

  static propTypes = {
    documentCount: PropTypes.string,
    storageSize: PropTypes.string,
    avgDocumentSize: PropTypes.string,
    indexCount: PropTypes.string,
    totalIndexSize: PropTypes.string,
    avgIndexSize: PropTypes.string,
    isReadonly: PropTypes.bool,
    isTimeSeries: PropTypes.bool,
    isEditing: PropTypes.bool
  };

  /**
   * Render CollectionStats component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (this.props.isReadonly === true || this.props.isEditing === true) {
      return <div className={styles['collection-stats-empty']} />;
    }

    return (
      <div className={styles['collection-stats']}>
        <DocumentStatsItem
          isTimeSeries={this.props.isTimeSeries}
          documentCount={this.props.documentCount}
          storageSize={this.props.storageSize}
          avgDocumentSize={this.props.avgDocumentSize}
        />
        {!this.props.isTimeSeries && (
          <IndexStatsItem
            indexCount={this.props.indexCount}
            totalIndexSize={this.props.totalIndexSize}
            avgIndexSize={this.props.avgIndexSize}
          />
        )}
      </div>
    );
  }
}

export default CollectionStats;
export { CollectionStats };
