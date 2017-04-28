const moment = require('moment');
const React = require('react');
const PropTypes = require('prop-types');

/**
 * The component class.
 */
const CLASS = 'element-value element-value-is-date';

/**
 * The date format.
 */
const FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

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
    const value = moment(this.props.value).format(FORMAT);
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
  value: PropTypes.any.isRequired
};

module.exports = DateValue;
