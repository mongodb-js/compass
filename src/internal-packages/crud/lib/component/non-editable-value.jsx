'use strict';

const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * Non editable value component.
 */
class NonEditableValue extends React.Component {

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
   * Render a single non editable value.
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

NonEditableValue.displayName = 'NonEditableValue';

module.exports = NonEditableValue;
