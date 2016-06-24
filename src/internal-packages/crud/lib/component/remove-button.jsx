'use strict';

const React = require('react');

/**
 * Component for the update button.
 */
class RemoveButton extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the button.
   *
   * @returns {Component} The button component.
   */
  render() {
    return (
      <button
        className='btn btn-default btn-xs error'
        type='button'
        onClick={this.props.handler}>
        Delete
      </button>
    );
  }
}

RemoveButton.displayName = 'RemoveButton';

module.exports = RemoveButton;
