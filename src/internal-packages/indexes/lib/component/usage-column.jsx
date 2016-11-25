const React = require('react');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:indexes:usage-column');

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
    if (_.isUndefined(this.props.usage)) {
      return NO_USAGE_STATS;
    }
    return `${this.props.usage} index hits since index creation or last\n server restart`;
  }

  renderSince() {
    if (_.isUndefined(this.props.since)) {
      return null;
    }
    return (
      <div className="usage-since">
        since&nbsp;
        <span>
          {this.props.since ? this.props.since.toDateString() : 'N/A'}
        </span>
      </div>
    );
  }

  /**
   * Render the usage column.
   *
   * @returns {React.Component} The usage column.
   */
  render() {
    const usage = _.isUndefined(this.props.usage) ? 'N/A' : this.props.usage;
    return (
      <td className="usage-column">
        <span className="usage">
          <div className="quantity" title={this.tooltip()}>
            {usage}
          </div>
          {this.renderSince()}
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
