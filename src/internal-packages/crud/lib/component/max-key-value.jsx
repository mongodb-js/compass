'use strict';

const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * MaxKey value component.
 */
class MaxKeyValue extends React.Component {

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
   * Render a single max key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={VALUE_CLASS}>
        MaxKey
      </div>
    );
  }
}

MaxKeyValue.displayName = 'MaxKeyValue';

module.exports = MaxKeyValue;
