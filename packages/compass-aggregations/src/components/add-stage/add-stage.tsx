import React from 'react';
import { connect } from 'react-redux';
import { Button, IconButton, Icon, css, spacing, Link } from '@mongodb-js/compass-components';

import { addStage } from '../../modules/pipeline-builder/stage-editor';
import { RootState } from '../../modules';


const containerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[2]
});

const linkContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

type AddStageProps = {
  index: number;
  numStages: number;
  onAddStageClick: (after?: number) => void;
}

export const AddStage = ({
  onAddStageClick,
  numStages,
  index,
}: AddStageProps) => {
  // If we are on the last stage, show a normal button instead of an icon button
  if (index === undefined || index + 1 === numStages) {
    return (
      <div className={containerStyles}>
        <Button data-testid="add-stage" onClick={() => onAddStageClick()} variant="primary" leftGlyph={<Icon glyph="Plus"></Icon>}>
          Add Stage
        </Button>
  
        <div className={linkContainerStyles}>
          <Link href='https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/'>Learn more about aggregation pipeline stages</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <IconButton aria-label='Add stage' data-testid="add-stage" onClick={() => onAddStageClick(index)}>
        <Icon glyph="Plus"></Icon>
      </IconButton>
    </div>
  );
}

export default connect((state: RootState) => {
  return {
    numStages: state.pipelineBuilder.stageEditor.stageIds.length,
  }
}, { onAddStageClick: addStage })(AddStage);
 