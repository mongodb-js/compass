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
class BsonDate extends React.Component {

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

BsonDate.displayName = 'BsonDate';

BsonDate.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = BsonDate;
