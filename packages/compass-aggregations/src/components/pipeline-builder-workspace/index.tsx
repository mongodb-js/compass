import React from 'react';
import { connect } from 'react-redux';
import { css, cx, spacing } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import type { PipelineMode } from '../../modules/pipeline-builder/pipeline-mode';
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';
import PipelineAsTextWorkspace from './pipeline-as-text-workspace';
import AggregationSidePanel from '../aggregation-side-panel';

const containerStyles = css({
  display: 'flex',
  overflow: 'hidden',
  paddingRight: spacing[3],
  paddingLeft: spacing[3],
  gap: spacing[2],
  height: '100%',
});

const workspaceStyles = css({
  paddingBottom: spacing[3],
  width: '100%',
  overflow: 'auto',
});

const workspaceWithSidePanelEnabledStyles = css({
  width: '75%',
});

const sidePanelStyles = css({
  width: '25%',
});

type PipelineBuilderWorkspaceProps = {
  pipelineMode: PipelineMode;
  isPanelOpen: boolean;
};

export const PipelineBuilderWorkspace: React.FunctionComponent<
  PipelineBuilderWorkspaceProps
> = ({ pipelineMode, isPanelOpen }) => {
  const workspace =
    pipelineMode === 'builder-ui' ? (
      <PipelineBuilderUIWorkspace />
    ) : (
      <PipelineAsTextWorkspace />
    );

  const isSidePanelEnabled = isPanelOpen && pipelineMode === 'builder-ui';

  return (
    <div className={containerStyles} data-testid="pipeline-builder-workspace">
      <div
        className={cx(
          workspaceStyles,
          isSidePanelEnabled && workspaceWithSidePanelEnabledStyles
        )}
      >
        {workspace}
      </div>
      {isSidePanelEnabled && (
        <div className={sidePanelStyles}>
          <AggregationSidePanel />
        </div>
      )}
    </div>
  );
};

const mapState = ({
  pipelineBuilder: { pipelineMode },
  sidePanel: { isPanelOpen },
}: RootState) => ({
  pipelineMode,
  isPanelOpen,
});

export default connect(mapState)(PipelineBuilderWorkspace);
