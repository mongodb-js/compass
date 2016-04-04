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
    return (
      <div className={CLASS}>
        {this.props.children}
      </div>
    );
  }
}

module.exports = FormGroup;
