'use strict';

const React = require('react');

/**
 * The button constant.
 */
const BUTTON = 'button';

/**
 * Component for a button with an icon.
 */
class IconButton extends React.Component {

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
    return React.createElement(
      'button',
      {
        type: BUTTON,
        title: this.props.title,
        'data-test-id': this.props.dataTestId,
        className: this.props.className,
        onClick: this.props.clickHandler },
      React.createElement('i', { className: this.props.iconClassName, 'aria-hidden': true })
    );
  }
}

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
  title: React.PropTypes.string,
  clickHandler: React.PropTypes.func.isRequired,
  className: React.PropTypes.string,
  iconClassName: React.PropTypes.string.isRequired,
  dataTestId: React.PropTypes.string
};

module.exports = IconButton;