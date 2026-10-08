import React from 'react';
import { Toggle, useTranslation } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { changeStageDisabled } from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';

const ToggleStage = ({
  index,
  isEnabled,
  className,
  onChange,
}: {
  index: number;
  isEnabled: boolean;
  className?: string;
  onChange: (index: number, isEnabled: boolean) => void;
}) => {
  const t = useTranslation();
  const TOOLTIP = isEnabled
    ? t('aggregations.stage.exclude', 'Exclude stage from pipeline')
    : t('aggregations.stage.include', 'Include stage in pipeline');
  return (
    <Toggle
      className={className}
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
