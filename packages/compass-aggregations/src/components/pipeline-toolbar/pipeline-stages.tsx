import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import type { Dispatch } from 'redux';
import {
  Pipeline,
  Stage,
  Description,
  Link,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { stageAdded } from '../../modules/pipeline';

const noStagesTextStyles = css({
  margin: 0,
});

const pipelineStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const PipelineStages: React.FunctionComponent<PipelineStagesProps> = ({
  stages,
  onStageAdded,
}) => {
  if (stages.length === 0) {
    return (
      <Description className={noStagesTextStyles}>
        Your pipeline is currently empty. To get started select the{' '}
        <Link onClick={() => onStageAdded()} hideExternalIcon>
          first stage.
        </Link>
        Your pipeline is currently empty. To get started select the
        <Link hideExternalIcon>first stage.</Link>
      </Description>
    );
  }
  return (
    <Pipeline className={pipelineStyles} size="small">
      {stages.map((stage) => (
        <Stage key={stage}>{stage}</Stage>
      ))}
    </Pipeline>
  );
};

const mapState = (state: RootState) => ({
  stages: state.pipeline.map((x) => x.stageOperator),
});
const mapDispatch = (dispatch: Dispatch) => ({
  onStageAdded: () => {
    dispatch(stageAdded());
  },
});
const connector = connect(mapState, mapDispatch);
type PipelineStagesProps = ConnectedProps<typeof connector>;
export default connector(PipelineStages);
