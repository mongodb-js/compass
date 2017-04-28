const React = require('react');
const PropTypes = require('prop-types');

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
    return (
      <button
        type={BUTTON}
        title={this.props.title}
        data-test-id={this.props.dataTestId}
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

module.exports = IconButton;
