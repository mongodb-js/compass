'use strict';

const React = require('react');

/**
 * Component for the update button.
 */
class UpdateButton extends React.Component {

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
        className='btn btn-default btn-xs update'
        type='button'
        onClick={this.props.handler}>
        Update
      </button>
    );
  }
}

UpdateButton.displayName = 'UpdateButton';

module.exports = UpdateButton;
