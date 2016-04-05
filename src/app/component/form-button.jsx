'use strict';

const React = require('react');

/**
 * Represents a form button component.
 */
class FormButton extends React.Component {

  /**
   * Renders the form button component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return (
      <button type='submit' name={this.props.name} className='btn btn-primary'>
        {this.props.children}
      </button>
    );
  }
}

module.exports = FormButton;
