const React = require('react');
const PropTypes = require('prop-types');
const { TextButton } = require('hadron-react-buttons');

/**
 * The wrapper class.
 */
const WRAPPER = 'tooltip-button-wrapper';

/**
 * Button component that is aware of the write state of the application.
 * This button contains only text, no icons, no animations.
 */
// TODO: remove this whole file
class TextWriteButton extends React.Component {

  /**
   * Determine if the application is in a writable state.
   *
   * @returns {Boolean} If the application is writable.
   */
  isWritable() {
    return true;
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={WRAPPER}>
        <TextButton
          className={this.props.className}
          dataTestId={this.props.dataTestId}
          disabled={!this.isWritable()}
          clickHandler={this.props.clickHandler}
          text={this.props.text} />
      </div>
    );
  }
}

TextWriteButton.propTypes = {
  className: PropTypes.string.isRequired,
  clickHandler: PropTypes.func.isRequired,
  dataTestId: PropTypes.string,
  isCollectionLevel: PropTypes.bool,
  text: PropTypes.string.isRequired,
  tooltipId: PropTypes.string.isRequired
};

TextWriteButton.displayName = 'TextWriteButton';

module.exports = TextWriteButton;
