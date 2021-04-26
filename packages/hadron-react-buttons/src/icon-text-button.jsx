import React from 'react';
import PropTypes from 'prop-types';

/**
 * The button constant.
 */
const BUTTON = 'button';

/**
 * Component for a button with an icon and text.
 */
class IconTextButton extends React.Component {

  /**
   * By default should not need to to re-render itself.
   *
   * @returns {Boolean} Always false.
   */
  shouldComponentUpdate() {
    return false;
  }

  /**
   * Render the button.
   *
   * @returns {Component} The button component.
   */
  render() {
    return (
      <button
        type={BUTTON}
        data-test-id={this.props.dataTestId}
        className={this.props.className}
        onClick={this.props.clickHandler}>
        <i className={this.props.iconClassName} aria-hidden />
        {this.props.text}
      </button>
    );
  }
}

IconTextButton.displayName = 'IconTextButton';

IconTextButton.propTypes = {
  text: PropTypes.string,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  iconClassName: PropTypes.string.isRequired,
  dataTestId: PropTypes.string
};

export default IconTextButton;
