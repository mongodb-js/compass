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
        type={BUTTON}
        title={this.props.title}
        className='btn btn-default btn-xs'
        onClick={this.props.clickHandler}>
        <i className={this.props.iconClassName} aria-hidden='true'></i>
      </button>
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

IconButton.displayName = 'IconButton';

module.exports = IconButton;
