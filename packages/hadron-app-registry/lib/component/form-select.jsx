'use strict';

const React = require('react');

/**
 * The classname for the form-select component.
 */
const CLASS = 'form-control';

/**
 * Represents a form select component.
 */
class FormSelect extends React.Component {

  /**
   * Renders the form select component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return (
      <select name={this.props.name} className={CLASS}>
        {this.props.children}
      </select>
    );
  }
}

module.exports = FormSelect;
