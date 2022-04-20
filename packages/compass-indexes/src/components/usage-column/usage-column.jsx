import isUndefined from 'lodash.isundefined';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';

import classnames from 'classnames';
import styles from './usage-column.module.less';

const TOOLTIP_ID = 'index-usage';

/**
 * No usage stats constant.
 */
const NO_USAGE_STATS =
  'Either the server does not support the $indexStats command' +
  'or the user is not authorized to execute it.';

/**
 * Component for the usage column.
 */
class UsageColumn extends PureComponent {
  static displayName = 'UsageColumn';

  static propTypes = {
    usage: PropTypes.any,
    since: PropTypes.any,
  };

  /**
   * Render the usage tooltip text.
   *
   * @returns {String} The tooltip.
   */
  tooltip() {
    if (isUndefined(this.props.usage)) {
      return NO_USAGE_STATS;
    }
    return `${this.props.usage} index hits since index creation or last\n server restart`;
  }

  renderSince() {
    if (isUndefined(this.props.since)) {
      return null;
    }
    return (
      <div className={classnames(styles['usage-column-since'])}>
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
    const usage = isUndefined(this.props.usage) ? '0' : this.props.usage;
    const tooltipText = `${this.tooltip()}`;
    const tooltipOptions = {
      'data-tip': tooltipText,
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true,
      'data-multiline': true,
    };
    return (
      <td className={classnames(styles['usage-column'])}>
        <span>
          <div
            {...tooltipOptions}
            className={classnames(styles['usage-column-quantity'])}
            data-test-id="index-table-usage"
          >
            <ReactTooltip id={TOOLTIP_ID} />
            {usage}
          </div>
          {this.renderSince()}
        </span>
      </td>
    );
  }
}

export default UsageColumn;
