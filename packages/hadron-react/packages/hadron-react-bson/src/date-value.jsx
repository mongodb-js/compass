const moment = require('moment');
const React = require('react');

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
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = DateValue;
