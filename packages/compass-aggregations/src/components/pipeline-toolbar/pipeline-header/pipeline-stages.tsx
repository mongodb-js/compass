import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
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

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
});

const descriptionStyles = css({
  padding: 0,
});

// todo: remove this post removal of global styles
const resetParaStyles = css({
  margin: 'inherit !important',
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

const PipelineStages: React.FunctionComponent<PipelineStagesProps> = ({
  isEditing,
  stages,
  onStageAdded,
  onChangeWorkspace,
}) => {
  if (stages.filter(Boolean).length === 0) {
    return (
      <div className={containerStyles} data-testid="toolbar-pipeline-stages">
        <Description className={cx(descriptionStyles, resetParaStyles)}>
          Your pipeline is currently empty. To get started select the&nbsp;
          <Link
            className={addStageStyles}
            as="button"
            onClick={() => onStageAdded()}
            hideExternalIcon
          >
            first stage.
          </Link>
        </Description>
      </div>
    );
  }
  return (
    <div className={containerStyles} data-testid="toolbar-pipeline-stages">
      <Pipeline size="small">
        {stages.filter(Boolean).map((stage, index) => (
          <Stage key={`${index}-${stage}`}>{stage}</Stage>
        ))}
      </Pipeline>
      {isEditing && (
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
  stages: pipeline.map((x) => x.stageOperator),
  isEditing: workspace === 'results',
});
const mapDispatch = {
  onStageAdded: stageAdded,
  onChangeWorkspace: changeWorkspace,
};
const connector = connect(mapState, mapDispatch);
type PipelineStagesProps = ConnectedProps<typeof connector>;
export default connector(PipelineStages);
