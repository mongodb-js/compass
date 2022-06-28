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
import { stageAdded } from '../../../modules/pipeline';
import { changeWorkspace } from '../../../modules/workspace';
import type { Workspace } from '../../../modules/workspace';

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
  onStageAdded: () => void;
  onChangeWorkspace: (workspace: Workspace) => void;
};

export const PipelineStages: React.FunctionComponent<PipelineStagesProps> = ({
  isResultsMode,
  stages,
  showAddNewStage,
  onStageAdded,
  onChangeWorkspace,
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
                onClick={() => onStageAdded()}
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
          onClick={() => onChangeWorkspace('builder')}
          leftGlyph={<Icon glyph="Edit" />}
        >
          Edit
        </Button>
      )}
    </div>
  );
};

const mapState = ({ pipeline, workspace }: RootState) => ({
  stages: pipeline
    .filter((stage) => stage.isEnabled)
    .map(({ stageOperator }) => stageOperator)
    .filter(Boolean),
  showAddNewStage: pipeline.length === 0,
  isResultsMode: workspace === 'results',
});

const mapDispatch = {
  onStageAdded: stageAdded,
  onChangeWorkspace: changeWorkspace,
};
export default connect(mapState, mapDispatch)(PipelineStages);
