import numeral from 'numeral';
import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';

const TOOLTIP_ID = 'index-size';

/**
 * Component for the size column.
 */
class SizeColumn extends React.Component {

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
    const tooltipText = `${this.props.relativeSize.toFixed(2)}% compared to largest index`;
    const tooltipOptions = {
      'data-tip': tooltipText,
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true
    };
    return (
      <td className="size-column">
        <div className="quantity" data-test-id="index-table-size">
          {indexSize[0]}
        </div>
        <div className="unit">
          {indexSize[1]}
        </div>
        <div {...tooltipOptions} className="progress">
          <ReactTooltip id={TOOLTIP_ID}/>
          <div className="progress-bar" style={{ width: `${this.props.relativeSize}%`}}>
          </div>
        </div>
      </td>
    );
  }
}

SizeColumn.displaySize = 'SizeColumn';

SizeColumn.propTypes = {
  size: PropTypes.number.isRequired,
  relativeSize: PropTypes.number.isRequired
};

export default SizeColumn;
