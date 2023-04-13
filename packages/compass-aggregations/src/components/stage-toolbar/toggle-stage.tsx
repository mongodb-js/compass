import React from 'react';
import { Toggle } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { changeStageDisabled } from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';

const ToggleStage = ({
  index,
  isEnabled,
  onChange,
}: {
  index: number;
  isEnabled: boolean;
  onChange: (index: number, isEnabled: boolean) => void;
}) => {
  const TOOLTIP = isEnabled
    ? 'Exclude stage from pipeline'
    : 'Include stage in pipeline';
  return (
    <Toggle
      id="toggle-stage-button"
      checked={isEnabled}
      onChange={(val) => onChange(index, !val)}
      title={TOOLTIP}
      aria-label={TOOLTIP}
      size="xsmall"
    />
  );
};

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stage = state.pipelineBuilder.stageEditor.stages[
      ownProps.index
    ] as StoreStage;
    return {
      isEnabled: !stage.disabled,
    };
  },
  { onChange: changeStageDisabled }
)(ToggleStage);
