import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Body, Icon, IconButton } from '@mongodb-js/compass-components';

import styles from './summary-stat.module.less';

/**
 * The SummaryStat component.
 */
class SummaryStat extends Component {
  static displayName = 'SummaryStatComponent';

  static propTypes = {
    dataTestId: PropTypes.string,
    dataLink: PropTypes.string, // Info sprinkle (optional)
    label: PropTypes.string.isRequired, // Label of the stat
    value: PropTypes.any,
  };

  /**
   * Renders SummaryStat component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const label = this.props.label;
    const value = String(this.props.value);
    const dataLink = this.props.dataLink;
    const dataTestId = this.props.dataTestId;

    return (
      <div className={styles['summary-stat']} data-test-id={dataTestId}>
        {dataLink && (
          <IconButton
            className={styles['summary-stat-info-sprinkle']}
            href={dataLink}
            aria-label="More information on index usage in explain results"
          >
            <Icon glyph="InfoWithCircle" size="small" />
          </IconButton>
        )}
        <Body className={styles['summary-stat-label']}>{label}</Body>
        <Body className={styles['summary-stat-value']}>{value}</Body>
      </div>
    );
  }
}

export default SummaryStat;
