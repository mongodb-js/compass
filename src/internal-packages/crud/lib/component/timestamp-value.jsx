const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * Timestamp value component.
 */
class TimestampValue extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
  }

  /**
   * Render a single timestamp value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={VALUE_CLASS}>
        {String(this.element.currentValue)}
      </div>
    );
  }
}

TimestampValue.displayName = 'TimestampValue';

TimestampValue.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = TimestampValue;
