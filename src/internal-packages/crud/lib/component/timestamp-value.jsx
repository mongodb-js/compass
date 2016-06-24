'use strict';

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
    this.value = props.element.currentValue;
  }

  /**
   * Render a single timestamp value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={VALUE_CLASS}>
        {String(this.value)}
      </div>
    );
  }
}

TimestampValue.displayName = 'TimestampValue';

module.exports = TimestampValue;
