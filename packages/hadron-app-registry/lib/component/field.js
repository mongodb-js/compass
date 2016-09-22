'use strict';

const React = require('react');

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
      { className: 'element-field' },
      this.props.field
    );
  }
}

Field.displayName = 'Field';

Field.propTypes = {
  field: React.PropTypes.string.isRequired
};

module.exports = Field;