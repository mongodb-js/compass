import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash.isstring';
import { hasDistinctValue } from 'mongodb-query-util';
import {
  Body,
  css,
  cx,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

import constants from '../../constants/schema';

const { DECIMAL_128, DOUBLE, LONG, INT_32 } = constants;

const valueBubbleValueStyles = css({
  backgroundColor: palette.gray.light2,
  border: '1px solid transparent',
  color: palette.gray.dark2,
  padding: `${spacing[1] / 2} ${spacing[1]}`,
  borderRadius: spacing[1],
  '&:hover': {
    cursor: 'pointer',
  },
});

const valueBubbleValueSelectedStyles = css({
  backgroundColor: palette.yellow.base,
  color: palette.white,
});

class ValueBubble extends Component {
  static displayName = 'ValueBubbleComponent';

  static propTypes = {
    localAppRegistry: PropTypes.object.isRequired,
    fieldName: PropTypes.string.isRequired,
    queryValue: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    value: PropTypes.any.isRequired,
  };

  onBubbleClicked(e) {
    const QueryAction = this.props.localAppRegistry.getAction('Query.Actions');
    const action = e.shiftKey
      ? QueryAction.toggleDistinctValue
      : QueryAction.setValue;
    action({
      field: this.props.fieldName,
      value: this.props.value,
      unsetIfSet: true,
    });
  }

  /**
   * converts the passed in value into a string, supports the 4 numeric
   * BSON types as well.
   *
   * @param {Any} value     value to be converted to a string
   * @return {String}       converted value
   */
  _extractStringValue(value) {
    if (value && value._bsontype) {
      if ([DECIMAL_128, LONG].includes(value._bsontype)) {
        return value.toString();
      }
      if ([DOUBLE, INT_32].includes(value._bsontype)) {
        return String(value.value);
      }
    }
    if (isString(value)) {
      return value;
    }
    return String(value);
  }

  render() {
    const value = this._extractStringValue(this.props.value);
    const isValueInQuery = hasDistinctValue(
      this.props.queryValue,
      this.props.value
    );
    return (
      <li className="bubble">
        <Body>
          <button
            type="button"
            aria-label={`${isValueInQuery ? 'Remove' : 'Add'} ${value} ${
              isValueInQuery ? 'from' : 'to'
            } query`}
            className={cx(
              valueBubbleValueStyles,
              isValueInQuery && valueBubbleValueSelectedStyles
            )}
            onClick={this.onBubbleClicked.bind(this)}
          >
            {value}
          </button>
        </Body>
      </li>
    );
  }
}

export default ValueBubble;
