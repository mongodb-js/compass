import React from 'react';
import { connect } from 'react-redux';
import { css, spacing } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import type { PipelineMode } from '../../modules/pipeline-builder/pipeline-mode';
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';
import PipelineAsTextWorkspace from './pipeline-as-text-workspace';
import AggregationSidePanel from '../aggregation-side-panel';
import ResizeHandle from '../resize-handle';
import { Resizable } from 're-resizable';

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
      <div className={workspaceStyles}>{workspace}</div>
      {isSidePanelEnabled && (
        <Resizable
          defaultSize={{
            width: '25%',
            height: 'auto',
          }}
          minWidth={'15%'}
          maxWidth={'50%'}
          enable={{
            left: true,
          }}
          handleComponent={{
            left: <ResizeHandle />,
          }}
          handleStyles={{
            left: {
              left: '-1px', // default is -5px
              // The sidepanel container is a card with radius.
              // Having padding top, cleans the UI.
              paddingTop: spacing[2],
            },
          }}
        >
          <AggregationSidePanel />
        </Resizable>
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
