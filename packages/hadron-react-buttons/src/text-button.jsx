import React from 'react';
import PropTypes from 'prop-types';

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
        data-test-id={this.props['data-test-id']}
        title={this.props.title}
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
  title: PropTypes.string,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  'data-test-id': PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  style: PropTypes.object
};

export default TextButton;
