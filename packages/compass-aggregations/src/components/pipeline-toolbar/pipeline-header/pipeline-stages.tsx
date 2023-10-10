import React from 'react';
import { connect } from 'react-redux';
import {
  Pipeline,
  Stage,
  Description,
  Link,
  css,
  spacing,
  Button,
  Icon,
} from '@mongodb-js/compass-components';
import { AIExperienceEntry } from '@mongodb-js/compass-generative-ai';
import { useIsAIFeatureEnabled } from 'compass-preferences-model';

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

const aiExperienceContainerStyles = css({
  display: 'inline-block',
  marginLeft: spacing[1],
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
  const isAIFeatureEnabled = useIsAIFeatureEnabled(React);

  return (
    <div className={containerStyles} data-testid="toolbar-pipeline-stages">
      {stages.length === 0 ? (
        <Description className={descriptionStyles}>
          Your pipeline is currently empty.
          {showAddNewStage && (
            <>
              {isAIFeatureEnabled && showAIEntry ? (
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
          {isAIFeatureEnabled && showAIEntry && (
            <div className={aiExperienceContainerStyles}>
              <AIExperienceEntry
                onClick={onShowAIInputClick}
                type="aggregation"
              />
            </div>
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
    showAIEntry:
      !state.pipelineBuilder.aiPipeline.isInputVisible && !isResultsMode,
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
