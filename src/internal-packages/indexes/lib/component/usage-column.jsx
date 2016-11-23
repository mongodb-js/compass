const React = require('react');

/**
 * No usage stats constant.
 */
const NO_USAGE_STATS = 'Server versions prior to 3.2 do not support $indexStats';

/**
 * Component for the usage column.
 */
class UsageColumn extends React.Component {

  /**
   * Render the usage tooltip text.
   *
   * @returns {String} The tooltip.
   */
  tooltip() {
    if (this.props.usage) {
      return `${this.props.usage} index hits since index creation or last\n server restart`;
    }
    return NO_USAGE_STATS;
  }

  /**
   * Render the usage column.
   *
   * @returns {React.Component} The usage column.
   */
  render() {
    return (
      <td className="usage-column">
        <span className="usage">
          <div className="quantity" title={this.tooltip()}>
            {this.props.usage || '0'}
          </div>
          <div className="usage-since">
            since&nbsp;
            <span>
              {this.props.since ? this.props.since.toDateString() : 'N/A'}
            </span>
          </div>
        </span>
      </td>
    );
  }
}

UsageColumn.displayUsage = 'UsageColumn';

UsageColumn.propTypes = {
  usage: React.PropTypes.any,
  since: React.PropTypes.any
};

module.exports = UsageColumn;
