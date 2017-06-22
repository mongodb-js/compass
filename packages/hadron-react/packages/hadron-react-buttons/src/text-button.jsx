const React = require('react');
const PropTypes = require('prop-types');

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
    return (
      <button
        id={this.props.id}
        className={this.props.className}
        data-test-id={this.props.dataTestId}
        type={BUTTON}
        disabled={this.props.disabled}
        style={this.props.style}
        onClick={this.props.clickHandler}>
        {this.props.text}
      </button>
    );
  }
}

TextButton.displayName = 'TextButton';

TextButton.propTypes = {
  text: PropTypes.string.isRequired,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  dataTestId: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  style: PropTypes.object
};

module.exports = TextButton;
