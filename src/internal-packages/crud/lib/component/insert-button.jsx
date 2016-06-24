'use strict';

const React = require('react');

/**
 * Component for the insert button.
 */
class InsertButton extends React.Component {

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
        className='btn btn-primary'
        type='button'
        onClick={this.props.handler}>
        Insert
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

InsertButton.displayName = 'InsertButton';

module.exports = InsertButton;
