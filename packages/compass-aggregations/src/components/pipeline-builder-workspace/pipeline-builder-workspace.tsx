import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { PipelineMode } from '../../modules/pipeline-builder/pipeline-mode';
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';
import PipelineAsTextWorkspace from './pipeline-as-text-workspace';

type PipelineBuilderWorkspaceProps = {
  pipelineMode: PipelineMode;
};

export const PipelineBuilderWorkspace: React.FunctionComponent<
  PipelineBuilderWorkspaceProps
> = ({ pipelineMode }) => {
  const workspace =
    pipelineMode === 'builder-ui' ? (
      <PipelineBuilderUIWorkspace />
    ) : (
      <PipelineAsTextWorkspace />
    );
  return <div data-testid="pipeline-builder-workspace">{workspace}</div>;
};

const mapState = ({ pipelineBuilder: { pipelineMode } }: RootState) => ({
  pipelineMode,
});

export default connect(mapState)(PipelineBuilderWorkspace);
