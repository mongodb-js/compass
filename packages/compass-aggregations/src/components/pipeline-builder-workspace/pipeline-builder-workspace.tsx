import React from 'react';
import { connect } from 'react-redux';
import { css, spacing } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import type { PipelineMode } from '../../modules/pipeline-builder/pipeline-mode';
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';
import PipelineAsTextWorkspace from './pipeline-as-text-workspace';

const containerStyles = css({
  height: '100%',
  paddingBottom: spacing[3],
});

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
  return (
    <div className={containerStyles} data-testid="pipeline-builder-workspace">
      {workspace}
    </div>
  );
};

const mapState = ({ pipelineBuilder: { pipelineMode } }: RootState) => ({
  pipelineMode,
});

export default connect(mapState)(PipelineBuilderWorkspace);
