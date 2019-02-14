import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './summary-stat.less';

/**
 * The SummaryStat component.
 */
class SummaryStat extends Component {
  static displayName = 'SummaryStatComponent';

  static propTypes = {
    dataLink: PropTypes.string, // Info sprinkle (optional)
    label: PropTypes.string.isRequired, // Label of the stat
    value: PropTypes.number.isRequired,
    openLink: PropTypes.func.isRequired
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

    // Only render info sprinkle if data link was provided
    const infoSprinkle = dataLink
      ? (
        <i
          className={classnames(styles['summary-stat-info-sprinkle'])}
          onClick={this.props.openLink.bind(this, dataLink)}
        ></i>
      )
      : null;

    // nReturned is represented as bubble value, other stats as simple string
    const modifier = (this.props.dataLink === 'nReturned')
      ? classnames(styles['summary-stat-has-nreturned'])
      : '';

    return (
      <div className={classnames(styles['summary-stat'], styles[modifier])}>
        {infoSprinkle}
        <span className={classnames(styles['summary-stat-label'])}>{label}</span>
        <span className={classnames(styles['summary-stat-value'])}>{value}</span>
      </div>
    );
  }
}

export default SummaryStat;
