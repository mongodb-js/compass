'use strict';

const React = require('react');

/**
 * Component for the usage column.
 */
class UsageColumn extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the usage column.
   *
   * @returns {React.Component} The usage column.
   */
  render() {
    return (
      <td className='usage-column'>
        <span className='usage'>
          <div className='quantity' title={`${this.props.usage} index hits since index creation or last\n server restart`}>
            {this.props.usage}
          </div>
          <div className='usage-since'>
            since&nbsp;
            <span>
              {this.props.since.toDateString()}
            </span>
          </div>
        </span>
      </td>
    );
  }
}

UsageColumn.displayUsage = 'UsageColumn';

module.exports = UsageColumn;
