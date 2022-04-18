import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash.isstring';
import { hasDistinctValue } from 'mongodb-query-util';
import constants from '../../constants/schema';
const { DECIMAL_128, DOUBLE, LONG, INT_32 } = constants;

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
    const selectedClass = hasDistinctValue(
      this.props.queryValue,
      this.props.value
    )
      ? 'selected'
      : 'unselected';
    return (
      <li className="bubble">
        {/* eslint-disable jsx-a11y/no-static-element-interactions */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <code
          className={`selectable ${selectedClass}`}
          onClick={this.onBubbleClicked.bind(this)}
        >
          {value}
        </code>
        {/* eslint-enable jsx-a11y/no-static-element-interactions */}
      </li>
    );
  }
}

export default ValueBubble;
