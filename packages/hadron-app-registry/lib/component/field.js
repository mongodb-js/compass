'use strict';

const React = require('react');

/**
 * The document field class.
 */
const FIELD_CLASS = 'document-property-key';

/**
 * The component for the field name.
 */
class Field extends React.Component {

  /**
   * Render the field name for the element.
   *
   * @returns {React.Component} The field component.
   */
  render() {
    return React.createElement(
      'div',
      { className: FIELD_CLASS },
      this.props.field
    );
  }
}

Field.displayName = 'Field';

module.exports = Field;