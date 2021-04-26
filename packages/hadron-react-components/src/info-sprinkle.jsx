import React from 'react';
import PropTypes from 'prop-types';

/**
 * An info sprinkle which can be clicked to perform the work in the
 * onClickHandler. The onClickHandler receives the helpLink argument.
 */
class InfoSprinkle extends React.Component {

  /**
   * Render the input.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <i className="info-sprinkle"
        onClick={this.props.onClickHandler.bind(this, this.props.helpLink)}
      />
    );
  }
}

InfoSprinkle.displayName = 'InfoSprinkle';

InfoSprinkle.propTypes = {
  onClickHandler: PropTypes.func.isRequired,  // e.g. require('electron').shell.openExternal
  helpLink: PropTypes.string.isRequired
};

export default InfoSprinkle;
