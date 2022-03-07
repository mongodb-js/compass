import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Pipeline,
  Stage,
  Description,
  css,
  Link,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';

const noStagesTextStyles = css({
  margin: 0,
});

const PipelineStages: React.FunctionComponent<PipelineStagesProps> = ({
  stages,
}) => {
  if (stages.length === 0) {
    return (
      <Description className={noStagesTextStyles}>
        Your pipeline is currently empty. To get started select the
        <Link hideExternalIcon>first stage.</Link>
      </Description>
    );
  }
  return (
    <Pipeline size="small">
      {stages.map((stage) => (
        <Stage key={stage}>{stage}</Stage>
      ))}
    </Pipeline>
  );
};

const mapState = (state: RootState) => ({
  stages: state.pipeline.map((x) => x.stageOperator),
});
const connector = connect(mapState);
type PipelineStagesProps = ConnectedProps<typeof connector>;
export default connector(PipelineStages);
