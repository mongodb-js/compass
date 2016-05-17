'use strict';

const React = require('react');

/**
 * The classname for the form-group component.
 */
const CLASS = 'form-group';

/**
 * Represents a form group component.
 */
class FormGroup extends React.Component {

  /**
   * Renders the form group component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return React.createElement(
      'div',
      { className: CLASS },
      this.props.children
    );
  }
}

FormGroup.displayName = 'FormGroup';

module.exports = FormGroup;