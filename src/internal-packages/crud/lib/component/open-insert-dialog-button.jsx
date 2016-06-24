'use strict';

const React = require('react');

/**
 * Component for the open insert dialog button.
 */
class OpenInsertDialogButton extends React.Component {

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
        className='btn btn-default btn-xs open-insert'
        type='button'
        onClick={this.props.handler}>
        + Insert
      </button>
    );
  }

  /**
   * Never needs to re-render.
   */
  shouldComponentUpdate() {
    return false;
  }
}

OpenInsertDialogButton.displayName = 'OpenInsertDialogButton';

module.exports = OpenInsertDialogButton;
