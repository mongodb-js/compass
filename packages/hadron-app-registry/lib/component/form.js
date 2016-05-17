'use strict';

const React = require('react');

/**
 * Represents a grouped list component.
 */
class Form extends React.Component {

  /**
   * Renders the form component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return React.createElement(
      'form',
      this.props,
      this.props.children
    );
  }
}

Form.displayName = 'Form';

module.exports = Form;