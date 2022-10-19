import React from 'react';
import PropTypes from 'prop-types';

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
    return (
      <button
        type="button"
        title={this.props.title}
        data-testid={this.props.dataTestId}
        className={this.props.className}
        onClick={this.props.clickHandler}>
        <i className={this.props.iconClassName} aria-hidden />
      </button>
    );
  }
}

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
  title: PropTypes.string,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  iconClassName: PropTypes.string.isRequired,
  dataTestId: PropTypes.string
};

export default IconButton;
