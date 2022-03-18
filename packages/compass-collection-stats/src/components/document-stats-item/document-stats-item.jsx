import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CollectionStatsItem from '../collection-stats-item';

import styles from './document-stats-item.module.less';

/**
 * The list class.
 */
const LIST_CLASS = 'document-stats-item';

/**
 * Documents constant.
 */
const DOCUMENTS = 'Documents';

/**
 * Total size constant.
 */
const STORAGE_SIZE = 'storage size';

/**
 * Average size constant.
 */
const AVG_SIZE = 'avg. size';

/**
 * The document stats item component.
 */
class DocumentStatsItem extends Component {
  static displayName = 'DocumentStatsItem';

  static propTypes = {
    documentCount: PropTypes.string.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    storageSize: PropTypes.string.isRequired,
    avgDocumentSize: PropTypes.string.isRequired
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   *
   */
  render() {
    const { isTimeSeries } = this.props;

    return (
      <div data-testid="document-stats-item" className={styles[LIST_CLASS]}>
        {!isTimeSeries && <CollectionStatsItem
          dataTestId="document-count"
          label={DOCUMENTS}
          value={this.props.documentCount}
          primary
        />}
        <CollectionStatsItem
          dataTestId="storage-size"
          label={STORAGE_SIZE}
          value={this.props.storageSize}
        />
        {!isTimeSeries && <CollectionStatsItem
          dataTestId="avg-document-size"
          label={AVG_SIZE}
          value={this.props.avgDocumentSize}
        />}
      </div>
    );
  }
}

export default DocumentStatsItem;
export { DocumentStatsItem };
