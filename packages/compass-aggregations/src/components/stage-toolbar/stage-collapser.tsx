import React from 'react';
import { connect } from 'react-redux';
import { IconButton, Icon } from '@mongodb-js/compass-components';
import { changeStageCollapsed } from '../../modules/pipeline-builder/stage-editor';
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
  const title = isExpanded ? 'Collapse' : 'Expand';
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
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    if (stage.type !== 'stage') {
      throw new Error('Expected stage to be BuilderStage');
    }
    return {
      isExpanded: !stage.collapsed,
    };
  },
  { onChange: changeStageCollapsed }
)(StageCollapser);
