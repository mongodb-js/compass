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
    return (
      <form {...this.props}>
        {this.props.children}
      </form>
    );
  }
}

module.exports = Form;
