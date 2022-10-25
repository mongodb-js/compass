import React from 'react';
import { connect } from 'react-redux';
import {
  Pipeline,
  Stage,
  Description,
  Link,
  css,
  cx,
  spacing,
  Button,
  Icon,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../../modules';
import { editPipeline } from '../../../modules/workspace';
import type { Workspace } from '../../../modules/workspace';
import { getPipelineStageOperatorsFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import { addStage } from '../../../modules/pipeline-builder/stage-editor';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const descriptionStyles = css({
  padding: 0,
});

const addStageStyles = css({
  border: 'none',
  padding: 0,
  backgroundColor: 'transparent',
  span: {
    // LG style is applied first
    backgroundImage: 'none !important',
  },
});

type PipelineStagesProps = {
  isResultsMode: boolean;
  stages: string[];
  showAddNewStage: boolean;
  onAddStageClick: () => void;
  onEditPipelineClick: (workspace: Workspace) => void;
};

export const PipelineStages: React.FunctionComponent<PipelineStagesProps> = ({
  isResultsMode,
  stages,
  showAddNewStage,
  onAddStageClick,
  onEditPipelineClick,
}) => {
  return (
    <div className={containerStyles} data-testid="toolbar-pipeline-stages">
      {stages.length === 0 ? (
        <Description className={cx(descriptionStyles)}>
          Your pipeline is currently empty.
          {showAddNewStage && (
            <>
              {' '}
              To get started select the&nbsp;
              <Link
                className={addStageStyles}
                as="button"
                onClick={() => onAddStageClick()}
                hideExternalIcon
                data-testid="pipeline-toolbar-add-stage-button"
              >
                first stage.
              </Link>
            </>
          )}
        </Description>
      ) : (
        <Pipeline size="small">
          {stages.map((stage, index) => (
            <Stage key={`${index}-${stage}`}>{stage}</Stage>
          ))}
        </Pipeline>
      )}
      {isResultsMode && (
        <Button
          data-testid="pipeline-toolbar-edit-button"
          variant="primaryOutline"
          size="small"
          onClick={() => onEditPipelineClick('builder')}
          leftGlyph={<Icon glyph="Edit" />}
        >
          Edit
        </Button>
      )}
    </div>
  );
};

const mapState = (state: RootState) => {
  const stages = getPipelineStageOperatorsFromBuilderState(state);
  return {
    stages,
    showAddNewStage: stages.length === 0,
    isResultsMode: state.workspace === 'results',
  };
};

const mapDispatch = {
  onAddStageClick: addStage,
  onEditPipelineClick: editPipeline,
};
export default connect(mapState, mapDispatch)(React.memo(PipelineStages));
