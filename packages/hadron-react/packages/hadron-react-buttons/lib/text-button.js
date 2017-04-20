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
   * Render the button.
   *
   * @returns {Component} The button component.
   */
  render() {
    return React.createElement(
      'button',
      {
        className: this.props.className,
        'data-test-id': this.props.dataTestId,
        type: BUTTON,
        disabled: this.props.disabled,
        onClick: this.props.clickHandler },
      this.props.text
    );
  }
}

TextButton.displayName = 'TextButton';

TextButton.propTypes = {
  text: React.PropTypes.string.isRequired,
  clickHandler: React.PropTypes.func.isRequired,
  className: React.PropTypes.string,
  dataTestId: React.PropTypes.string,
  disabled: React.PropTypes.bool
};

module.exports = TextButton;