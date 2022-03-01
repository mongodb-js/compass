import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Pipeline,
  Stage,
} from '@mongodb-js/compass-components';

const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  name,
  stages,
}) => {
  return <div>
    <Pipeline size="small">
      {stages.map(stage => <Stage key={stage}>{stage}</Stage>)}
    </Pipeline>
    {name}
  </div>;
};

const mapState = (state: any) => {
  return {
    name: state.name,
    stages: state.pipeline.map(x => x.stageOperator),
  };
};
const mapDispatch = { 
};

const connector = connect(mapState, mapDispatch);
type PipelineToolbarProps = ConnectedProps<typeof connector>;
export default connector(PipelineToolbar);
