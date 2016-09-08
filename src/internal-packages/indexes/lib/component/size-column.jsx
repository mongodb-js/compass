'use strict';

const React = require('react');
const numeral = require('numeral');

/**
 * Component for the size column.
 */
class SizeColumn extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the size column.
   *
   * @returns {React.Component} The size column.
   */
  render() {
    var indexSize = this._format(this.props.size).split(' ');
    return (
      <td className='size-column'>
        <div className='quantity'>
          {indexSize[0]}
        </div>
        <div className='unit'>
          {indexSize[1]}
        </div>
        <div className='progress' title={`${this.props.relativeSize}% compared to largest index`}>
          <div className='progress-bar' style={{ width: `${this.props.relativeSize}%` }}>
          </div>
        </div>
      </td>
    );
  }

  _format(size) {
    var precision = size <= 1000 ? '0' : '0.0';
    return numeral(size).format(precision + ' b');
  }
}

SizeColumn.displaySize = 'SizeColumn';

module.exports = SizeColumn;
