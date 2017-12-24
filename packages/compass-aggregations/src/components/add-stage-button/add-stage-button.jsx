import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/**
 * Display the add stage button.
 */
class AddStageButton extends PureComponent {
  static displayName = 'AddStageButtonComponent';

  static propTypes = {
    stageAdded: PropTypes.func.isRequired
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <button className="btn btn-default btn-xs" onClick={this.props.stageAdded}>
        Add Stage
      </button>
    );
  }
}

export default AddStageButton;
