'use strict';

const React = require('react');

/**
 * Component for the cancel button.
 */
class CancelEditButton extends React.Component {

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
        className='btn btn-link btn-xs cancel'
        type='button'
        onClick={this.props.handler}>
        Cancel
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

CancelEditButton.displayName = 'CancelEditButton';

module.exports = CancelEditButton;
