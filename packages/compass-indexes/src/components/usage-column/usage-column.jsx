import isUndefined from 'lodash.isundefined';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { Tooltip, Body } from '@mongodb-js/compass-components';

const NO_USAGE_STATS =
  'Either the server does not support the $indexStats command' +
  'or the user is not authorized to execute it.';

class UsageColumn extends PureComponent {
  static displayName = 'UsageColumn';

  static propTypes = {
    usage: PropTypes.any,
    since: PropTypes.any,
  };

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
      <span>
        (since&nbsp;
        {this.props.since ? this.props.since.toDateString() : 'N/A'})
      </span>
    );
  }

  render() {
    const usage = isUndefined(this.props.usage) ? '0' : this.props.usage;
    const tooltip = this.tooltip();
    return (
      <td>
        <Tooltip
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Body>
                {usage}&nbsp;{this.renderSince()}
              </Body>
            </span>
          )}
        >
          <Body>{tooltip}</Body>
        </Tooltip>
      </td>
    );
  }
}

export default UsageColumn;
