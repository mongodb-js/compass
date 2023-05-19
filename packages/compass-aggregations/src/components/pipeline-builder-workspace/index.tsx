import React from 'react';
import { connect } from 'react-redux';
import { css, spacing } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import type { PipelineMode } from '../../modules/pipeline-builder/pipeline-mode';
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';
import PipelineAsTextWorkspace from './pipeline-as-text-workspace';

const containerStyles = css({
  display: 'flex',
  overflow: 'hidden',
  paddingRight: spacing[3],
  paddingLeft: spacing[3],
  gap: spacing[2],
  height: '100%',
});

type PipelineBuilderWorkspaceProps = {
  pipelineMode: PipelineMode;
};

export const PipelineBuilderWorkspace: React.FunctionComponent<
  PipelineBuilderWorkspaceProps
> = ({ pipelineMode }) => {
  return (
    <div className={containerStyles} data-testid="pipeline-builder-workspace">
      {pipelineMode === 'builder-ui' ? (
        <PipelineBuilderUIWorkspace />
      ) : (
        <PipelineAsTextWorkspace />
      )}
    </div>
  );
};

const mapState = ({ pipelineBuilder: { pipelineMode } }: RootState) => ({
  pipelineMode,
});

export default connect(mapState)(PipelineBuilderWorkspace);
