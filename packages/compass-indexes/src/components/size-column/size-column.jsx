import numeral from 'numeral';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { Body, Tooltip } from '@mongodb-js/compass-components';

/**
 * Component for the size column.
 */
class SizeColumn extends PureComponent {
  static displayName = 'SizeColumn';

  static propTypes = {
    size: PropTypes.number.isRequired,
    relativeSize: PropTypes.number.isRequired,
  };

  _format(size) {
    const precision = size <= 1000 ? '0' : '0.0';
    return numeral(size).format(precision + ' b');
  }

  render() {
    const indexSize = this._format(this.props.size);
    const tooltip = `${this.props.relativeSize.toFixed(
      2
    )}% compared to largest index`;
    return (
      <td>
        <Tooltip
          data-testid="index-table-size"
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Body>{indexSize}</Body>
            </span>
          )}
        >
          <Body>{tooltip}</Body>
        </Tooltip>
      </td>
    );
  }
}

export default SizeColumn;
