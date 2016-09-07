'use strict';

const React = require('react');

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
    return (
      <td className='size-column'>
        <div className='quantity'>
          {this.props.size}
        </div>
        <div className='unit'>
          {this.props.unit}
        </div>
        <div className='progress' title={`${this.props.relativeSize}% compared to largest index`}>
          <div className='progress-bar' style={{ width: `${this.props.relativeSize}%` }}>
          </div>
        </div>
      </td>
    );
  }
}

SizeColumn.displaySize = 'SizeColumn';

module.exports = SizeColumn;
