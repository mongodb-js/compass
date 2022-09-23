import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Toggle, css, spacing } from '@mongodb-js/compass-components';

const toggleStyle = css({
  marginLeft: spacing[1]
});

/**
 * The toggle stage button.
 */
class ToggleStage extends PureComponent {
  static displayName = 'ToggleStageComponent';

  static propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    runStage: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired
  };

  /**
   * Handle stage toggled clicks.
   */
  onStageToggled = () => {
    this.props.stageToggled(this.props.index);
    this.props.setIsModified(true);
    this.props.runStage(this.props.index, true /* force execute */);
  };

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    const TOOLTIP = this.props.isEnabled
      ? 'Exclude stage from pipeline'
      : 'Include stage in pipeline';
    return (
      <Toggle
        id="toggle-stage-button"
        checked={this.props.isEnabled}
        onChange={this.onStageToggled}
        aria-label={TOOLTIP}
        size="xsmall"
        className={toggleStyle}
      />
    );
  }
}

export default ToggleStage;
