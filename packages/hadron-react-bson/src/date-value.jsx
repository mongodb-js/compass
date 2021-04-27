import moment from 'moment-timezone';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * The component class.
 */
const CLASS = 'element-value element-value-is-date';

/**
 * The date format.
 */
const FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

/**
 * BSON Date component.
 */
class DateValue extends React.Component {
  /**
   * Render a BSON date.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const time = moment(this.props.value);
    if (this.props.tz) {
      time.tz(this.props.tz);
    }
    const value = time.format(FORMAT);
    return (
      <div className={CLASS} title={value}>
        {value}
      </div>
    );
  }
}

DateValue.displayName = 'DateValue';

DateValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  tz: PropTypes.string
};

export default DateValue;
