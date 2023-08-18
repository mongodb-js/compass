import React from 'react';
import { connect } from 'react-redux';
import {
  AIExperienceEntry,
  Pipeline,
  Stage,
  Description,
  Link,
  css,
  spacing,
  Button,
  Icon,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';

import type { RootState } from '../../../modules';
import { editPipeline } from '../../../modules/workspace';
import type { Workspace } from '../../../modules/workspace';
import { getPipelineStageOperatorsFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import { addStage } from '../../../modules/pipeline-builder/stage-editor';
import { showInput as showAIInput } from '../../../modules/pipeline-builder/pipeline-ai';

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
  showAIEntry: boolean;
  onAddStageClick: () => void;
  onEditPipelineClick: (workspace: Workspace) => void;
  onShowAIInputClick: () => void;
};

const nbsp = '\u00a0';

export const PipelineStages: React.FunctionComponent<PipelineStagesProps> = ({
  isResultsMode,
  stages,
  showAddNewStage,
  showAIEntry,
  onAddStageClick,
  onEditPipelineClick,
  onShowAIInputClick,
}) => {
  const enableAIExperience = usePreference('enableAIExperience', React);

  return (
    <div className={containerStyles} data-testid="toolbar-pipeline-stages">
      {stages.length === 0 ? (
        <Description className={descriptionStyles}>
          Your pipeline is currently empty.
          {showAddNewStage && (
            <>
              {enableAIExperience && showAIEntry ? (
                <>{nbsp}Need help getting started?</>
              ) : (
                <>
                  {nbsp}To get started add the{nbsp}
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
            </>
          )}
          {enableAIExperience && showAIEntry && (
            <>
              {nbsp}
              <AIExperienceEntry onClick={onShowAIInputClick} />
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
  const stages = getPipelineStageOperatorsFromBuilderState(state, false);
  const isResultsMode = state.workspace === 'results';
  const isStageMode = state.pipelineBuilder.pipelineMode === 'builder-ui';
  return {
    showAIEntry: !state.pipelineBuilder.aiPipeline.isInputVisible,
    stages: stages.filter(Boolean) as string[],
    showAddNewStage:
      !state.pipelineBuilder.aiPipeline.isInputVisible &&
      !isResultsMode &&
      isStageMode &&
      stages.length === 0,
    isResultsMode,
  };
};

const mapDispatch = {
  onAddStageClick: addStage,
  onEditPipelineClick: editPipeline,
  onShowAIInputClick: showAIInput,
};
export default connect(mapState, mapDispatch)(React.memo(PipelineStages));
