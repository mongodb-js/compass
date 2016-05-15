'use strict';

const React = require('react');

/**
 * The classname for the form-input component.
 */
const CLASS = 'form-control';

/**
 * The text type class.
 */
const TYPE = 'text';

/**
 * Represents a form input component.
 */
class FormInput extends React.Component {

  /**
   * Renders the form input component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return (
      <input
        type={TYPE}
        placeholder={this.props.placeholder}
        name={this.props.name}
        className={CLASS} />
    );
  }
}

FormInput.displayName = 'FormInput';

module.exports = FormInput;
