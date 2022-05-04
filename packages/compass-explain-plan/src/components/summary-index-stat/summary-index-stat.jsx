import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';
import { Icon, IconButton } from '@mongodb-js/compass-components';

import { IndexDefinitionType } from '../index-definition-type';
import INDEX_TYPES from '../../constants/index-types';

import styles from './summary-index-stat.module.less';

/**
 * The SummaryIndexStat component.
 */
class SummaryIndexStat extends Component {
  static displayName = 'SummaryIndexStatComponent';

  static propTypes = {
    dataLink: PropTypes.string, // Info sprinkle (optional)
    indexType: PropTypes.oneOf(INDEX_TYPES).isRequired,
    index: PropTypes.object,
  };

  /**
   * Returns the message.
   *
   * @returns {String} The message.
   */
  getIndexMessageText() {
    const typeToMessage = {
      COLLSCAN: 'No index available for this query.',
      COVERED: 'Query covered by index:',
      MULTIPLE: 'Shard results differ (see details below)',
      INDEX: 'Query used the following index:',
    };

    return typeToMessage[this.props.indexType];
  }

  /**
   * Returns the index icon.
   *
   * @returns {String} The index icon.
   */
  getIndexMessageIcon() {
    const greenCheckMark = (
      <FontAwesome
        fixedWidth
        style={{ color: '#507b32' }}
        name="check-circle"
      />
    );
    const yellowWarning = (
      <FontAwesome
        fixedWidth
        style={{ color: '#fbb129' }}
        name="exclamation-triangle"
      />
    );
    const typeToIcon = {
      COLLSCAN: yellowWarning,
      COVERED: greenCheckMark,
      MULTIPLE: yellowWarning,
      INDEX: null,
      UNAVAILABLE: null,
    };

    return typeToIcon[this.props.indexType];
  }

  /**
   * Returns the hex color.
   *
   * @returns {String} The hex color.
   */
  getIndexMessageColor() {
    const typeToColor = {
      COLLSCAN: '#7F6A4E',
      COVERED: '#507b32',
      MULTIPLE: '#7F6A4E',
      INDEX: '#000',
      UNAVAILABLE: '#000',
    };

    return typeToColor[this.props.indexType];
  }

  /**
   * Renders SummaryIndexStat component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={styles['summary-index-stat']}>
        <IconButton
          className={styles['summary-index-stat-info-sprinkle']}
          href={this.props.dataLink}
          aria-label="More information on index usage in explain results"
        >
          <Icon glyph="InfoWithCircle" size="small" />
        </IconButton>
        <div className={this.props.index && styles['summary-index-stat-index']}>
          <span className={styles['summary-index-stat-index-icon']}>
            {this.getIndexMessageIcon()}
          </span>
          <span
            className={styles['summary-index-stat-index-message']}
            style={{ color: this.getIndexMessageColor() }}
          >
            {this.getIndexMessageText()}
          </span>
          {this.props.index ? (
            <IndexDefinitionType index={this.props.index} />
          ) : null}
        </div>
      </div>
    );
  }
}

export default SummaryIndexStat;
