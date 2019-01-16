import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for the option field toggle bar.
 */
class OptionsToggleBar extends React.Component {

  /**
   * Render the option field toggle bar.
   *
   * @returns {React.Component} The option field toggle bar.
   */
  render() {
    return (
      <div className="row text-center options-toggle-bar" onClick={this.props.onClick}>
        <div className="col-md-3 options-toggle-bar-header">
          {this.props.showOptions ?
            <i className="fa fa-angle-down"></i>
            : <i className="fa fa-angle-right"></i>}
            <p className="options-toggle-bar-header-text"> Options</p>
        </div>
        <div className="col-md-9">
          <hr />
        </div>
      </div>
    );
  }
}

OptionsToggleBar.displayName = 'OptionsToggleBar';

OptionsToggleBar.propTypes = {
  onClick: PropTypes.func.isRequired,
  showOptions: PropTypes.bool.isRequired
};

export default OptionsToggleBar;
