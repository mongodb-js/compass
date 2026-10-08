import React from 'react';
import { connect } from 'react-redux';
import {
  IconButton,
  Icon,
  useTranslation,
} from '@mongodb-js/compass-components';
import { changeStageCollapsed } from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';

const StageCollapser = ({
  index,
  isExpanded,
  onChange,
}: {
  index: number;
  isExpanded: boolean;
  onChange: (index: number, isExpanded: boolean) => void;
}) => {
  const t = useTranslation();
  const title = isExpanded
    ? t('aggregations.stage.collapse', 'Collapse')
    : t('aggregations.stage.expand', 'Expand');
  return (
    <IconButton
      onClick={() => onChange(index, isExpanded)}
      title={title}
      aria-label={title}
    >
      <Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'} size="small" />
    </IconButton>
  );
};

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stage = state.pipelineBuilder.stageEditor.stages[
      ownProps.index
    ] as StoreStage;
    return {
      isExpanded: !stage.collapsed,
    };
  },
  { onChange: changeStageCollapsed }
)(StageCollapser);
