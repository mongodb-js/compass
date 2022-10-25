import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Toggle, css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { changeStageDisabled } from '../../modules/pipeline-builder/stage-editor';

const toggleStyle = css({
  marginLeft: spacing[1]
});

/**
 * The toggle stage button.
 */
export class ToggleStage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  /**
   * Handle stage toggled clicks.
   */
  onStageToggled = (newVal) => {
    this.props.onChange(this.props.index, !newVal);
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

export default connect(
  (state, ownProps) => {
    return {
      isEnabled:
        !state.pipelineBuilder.stageEditor.stages[ownProps.index].disabled
    };
  },
  { onChange: changeStageDisabled }
)(ToggleStage);
