const app = require('hadron-app');
const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const { hasDistinctValue } = require('mongodb-query-util');

const { DECIMAL_128, DOUBLE, LONG, INT_32 } = require('../helpers');

class ValueBubble extends React.Component {
  onBubbleClicked(e) {
    const QueryAction = app.appRegistry.getAction('Query.Actions');
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

ValueBubble.propTypes = {
  fieldName: PropTypes.string.isRequired,
  queryValue: PropTypes.string,
  value: PropTypes.any.isRequired
};

module.exports = ValueBubble;
