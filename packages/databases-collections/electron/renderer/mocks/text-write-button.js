import React from 'react';
import PropTypes from 'prop-types';
import { TextButton } from 'hadron-react-buttons';
import { Tooltip } from 'hadron-react-components';

/**
 * The wrapper class.
 */
const WRAPPER = 'tooltip-button-wrapper';

/**
  * Button component that is aware of the write state of the application.
  * This button contains only text, no icons, no animations.
  */
// TODO: remove
class TextWriteButton extends React.Component {
  static displayName = 'TextWriteButton';

  static propTypes = {
    className: PropTypes.string.isRequired,
    clickHandler: PropTypes.func.isRequired,
    dataTestId: PropTypes.string,
    isCollectionLevel: PropTypes.bool,
    text: PropTypes.string.isRequired,
    tooltipId: PropTypes.string.isRequired
  }

  /**
  * Determine if the application is in a writable state.
  *
  * @returns {Boolean} If the application is writable.
  */
  isWritable() {
    const isWritable = true;
    return isWritable;
  }

  /**
  * Handle write state changes.
  *
  * @param {Object} state - The write state.
  */
  writeStateChanged(state) {
    this.setState(state);
  }

  /**
  * Get the tooltip text.
  *
  * @returns {String} The tooltip text.
  */
  tooltipText() {
    if (!this.isWritable()) {
      return 'Not writable';
    }
  }

  /**
  * Render the component.
  *
  * @returns {React.Component} The rendered component.
  */
  render() {
    const tooltip = (this.isWritable()) ? null : (<Tooltip id={this.props.tooltipId} />);
    return (
      <div className={WRAPPER} data-tip={this.tooltipText()} data-for={this.props.tooltipId}>
        <TextButton
          className={this.props.className}
          dataTestId={this.props.dataTestId}
          disabled={!this.isWritable()}
          clickHandler={this.props.clickHandler}
          text={this.props.text}
        />
        {tooltip}
      </div>
    );
  }
}

export default TextWriteButton;
