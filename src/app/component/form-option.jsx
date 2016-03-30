'use strict';

const React = require('react');

/**
 * Represents a form option component.
 */
class FormOption extends React.Component {

  /**
   * Renders the form option component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return (
      <option value={this.props.value}>
        {this.props.name}
      </option>
    );
  }
}

module.exports = FormOption;
