import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon, IconButton, palette } from '@mongodb-js/compass-components';

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
      <Icon
        glyph="CheckmarkWithCircle"
        style={{ color: palette.green.dark2 }}
        size="small"
      />
    );
    const yellowWarning = (
      <Icon
        glyph="Warning"
        style={{ color: palette.yellow.base }}
        size="small"
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
      COLLSCAN: palette.yellow.dark2,
      COVERED: palette.green.dark2,
      MULTIPLE: palette.yellow.dark2,
      INDEX: palette.gray.dark1,
      UNAVAILABLE: palette.black,
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
          target="_blank"
          aria-label="More information on index usage in explain results"
        >
          <Icon glyph="InfoWithCircle" size="small" />
        </IconButton>
        <div className={this.props.index && styles['summary-index-stat-index']}>
          <span className={styles['summary-index-stat-index-icon']}>
            {this.getIndexMessageIcon()}
          </span>
          <span style={{ color: this.getIndexMessageColor() }}>
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
