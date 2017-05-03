const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const ReactTooltip = require('react-tooltip');

// const debug = require('debug')('mongodb-compass:indexes:usage-column');

const TOOLTIP_ID = 'index-usage';

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
    const usage = _.isUndefined(this.props.usage) ? '0' : this.props.usage;
    const tooltipText = `${this.tooltip()}`;
    const tooltipOptions = {
      'data-tip': tooltipText,
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true,
      'data-multiline': true
    };
    return (
      <td className="usage-column">
        <span className="usage">
          <div {...tooltipOptions} className="quantity" data-test-id="index-table-usage">
            <ReactTooltip id={TOOLTIP_ID}/>
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
  usage: PropTypes.any,
  since: PropTypes.any
};

module.exports = UsageColumn;
