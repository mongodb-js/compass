import React from 'react';
import PropTypes from 'prop-types';

/**
 * The button constant.
 */
const BUTTON = 'button';

/**
 * Component for a button with an icon.
 */
class UpdatableIconButton extends React.Component {
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
        data-testid={this.props.dataTestId}
        className={this.props.className}
        onClick={this.props.clickHandler}
      >
        <i className={this.props.iconClassName} aria-hidden />
      </button>
    );
  }
}

UpdatableIconButton.displayName = 'UpdatableIconButton';

UpdatableIconButton.propTypes = {
  title: PropTypes.string,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  iconClassName: PropTypes.string.isRequired,
  dataTestId: PropTypes.string,
};

export default UpdatableIconButton;
