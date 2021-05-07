import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import CollectionStatsItem from 'components/collection-stats-item';

import styles from './document-stats-item.less';

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
const TOTAL_SIZE = 'total size';

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
    totalDocumentSize: PropTypes.string.isRequired,
    avgDocumentSize: PropTypes.string.isRequired
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   *
   */
  render() {
    return (
      <div className={classnames(styles[LIST_CLASS])}>
        <CollectionStatsItem label={DOCUMENTS} value={this.props.documentCount} primary />
        <CollectionStatsItem label={TOTAL_SIZE} value={this.props.totalDocumentSize} />
        <CollectionStatsItem label={AVG_SIZE} value={this.props.avgDocumentSize} />
      </div>
    );
  }
}

export default DocumentStatsItem;
export { DocumentStatsItem };
