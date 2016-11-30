const React = require('react');
const numeral = require('numeral');
const ReactTooltip = require('react-tooltip');

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
      'data-effect': 'solid',
      'data-border': true
    };
    return (
      <td className="size-column">
        <div className="quantity">
          {indexSize[0]}
        </div>
        <div className="unit">
          {indexSize[1]}
        </div>
        <div
          {...tooltipOptions}
          className="progress"
        >
          <ReactTooltip />
          <div className="progress-bar" style={{ width: `${this.props.relativeSize}%` }}>
          </div>
        </div>
      </td>
    );
  }
}

SizeColumn.displaySize = 'SizeColumn';

SizeColumn.propTypes = {
  size: React.PropTypes.number.isRequired,
  relativeSize: React.PropTypes.number.isRequired
};

module.exports = SizeColumn;
