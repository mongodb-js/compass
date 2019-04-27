import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { hasDistinctValue } from 'mongodb-query-util';
import { DECIMAL_128, DOUBLE, LONG, INT_32 } from 'constants';

class ValueBubble extends Component {
  static displayName = 'ValueBubbleComponent';

  static propTypes = {
    localAppRegistry: PropTypes.object.isRequired,
    fieldName: PropTypes.string.isRequired,
    queryValue: PropTypes.string,
    value: PropTypes.any.isRequired
  }

  onBubbleClicked(e) {
    const QueryAction = this.props.localAppRegistry.getAction('Query.Actions');
    const action = e.shiftKey ?
      QueryAction.toggleDistinctValue : QueryAction.setValue;
    action({
      field: this.props.fieldName,
      value: this.props.value,
      unsetIfSet: true
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
    if (_.has(value, '_bsontype')) {
      if (_.includes([ DECIMAL_128, LONG ], value._bsontype)) {
        return value.toString();
      }
      if (_.includes([ DOUBLE, INT_32 ], value._bsontype)) {
        return String(value.value);
      }
    }
    if (_.isString(value)) {
      return value;
    }
    return String(value);
  }

  render() {
    const value = this._extractStringValue(this.props.value);
    const selectedClass = hasDistinctValue(this.props.queryValue, this.props.value) ?
      'selected' : 'unselected';
    return (
      <li className="bubble">
        <code className={`selectable ${selectedClass}`} onClick={this.onBubbleClicked.bind(this)}>
          {value}
        </code>
      </li>
    );
  }
}

export default ValueBubble;
