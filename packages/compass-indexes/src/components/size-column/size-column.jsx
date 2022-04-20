import numeral from 'numeral';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';

import classnames from 'classnames';
import styles from './size-column.module.less';

const TOOLTIP_ID = 'index-size';

/**
 * Component for the size column.
 */
class SizeColumn extends PureComponent {
  static displayName = 'SizeColumn';

  static propTypes = {
    size: PropTypes.number.isRequired,
    relativeSize: PropTypes.number.isRequired,
  };

  _format(size) {
    const precision = size <= 1000 ? '0' : '0.0';
    return numeral(size).format(precision + ' b');
  }

  /**
   * Render the size column.
   *
   * @returns {React.Component} The size column.
   */
  render() {
    const indexSize = this._format(this.props.size).split(' ');
    const tooltipText = `${this.props.relativeSize.toFixed(
      2
    )}% compared to largest index`;
    const tooltipOptions = {
      'data-tip': tooltipText,
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true,
    };
    return (
      <td className={classnames(styles['size-column'])}>
        <div
          className={classnames(styles['size-column-quantity'])}
          data-test-id="index-table-size"
        >
          {indexSize[0]}
        </div>
        <div className={classnames(styles['size-column-unit'])}>
          {indexSize[1]}
        </div>
        <div
          {...tooltipOptions}
          className={classnames(styles['size-column-progress'])}
        >
          <ReactTooltip id={TOOLTIP_ID} />
          <div
            className={classnames(styles['size-column-progress-bar'])}
            style={{ width: `${this.props.relativeSize}%` }}
          />
        </div>
      </td>
    );
  }
}

export default SizeColumn;
