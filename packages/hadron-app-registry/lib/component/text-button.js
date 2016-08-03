'use strict';

const React = require('react');

/**
 * The button constant.
 */
const BUTTON = 'button';

/**
 * Component for a button with text.
 */
class TextButton extends React.Component {

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
    return React.createElement(
      'button',
      {
        className: this.props.className,
        type: BUTTON,
        onClick: this.props.clickHandler },
      this.props.text
    );
  }

  /**
   * By default should not need to to re-render itself.
   *
   * @returns {Boolean} Always false.
   */
  shouldComponentUpdate() {
    return false;
  }
}

TextButton.displayName = 'TextButton';

module.exports = TextButton;