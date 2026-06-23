import React from 'react';
import { css, KeylineCard, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';
import ResizeHandle from '../../resize-handle';
import type { RootState } from '../../../modules';
import { RerankFirstStageBanner } from '../../rerank-first-stage-banner';
import { getIsRerankFirstStage } from '../../../modules/pipeline-builder/builder-helpers';

const outerContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const rowStyles = css({
  display: 'flex',
  flex: 1,
});

const noPreviewEditorStyles = css({
  flex: 1,
  width: '100%',
});

const resultsStyles = css({
  flex: 1,
  overflowX: 'hidden',
});

const workspaceContainerStyles = css({
  paddingBottom: spacing[400],
  width: '100%',
  overflow: 'auto',
});

type PipelineAsTextWorkspaceProps = {
  isAutoPreview: boolean;
  showRerankFirstStageBanner: boolean;
};

const containerDataTestId = 'pipeline-as-text-workspace';

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({ isAutoPreview, showRerankFirstStageBanner }) => {
  if (!isAutoPreview) {
    return (
      <div className={workspaceContainerStyles}>
        <KeylineCard
          data-testid={containerDataTestId}
          className={outerContainerStyles}
        >
          {showRerankFirstStageBanner && (
            <RerankFirstStageBanner data-testid="pipeline-editor-rerank-first-stage-banner" />
          )}
          <div className={noPreviewEditorStyles}>
            <PipelineEditor />
          </div>
        </KeylineCard>
      </div>
    );
  }
  return (
    <div className={workspaceContainerStyles}>
      <KeylineCard
        data-testid={containerDataTestId}
        className={outerContainerStyles}
      >
        {showRerankFirstStageBanner && (
          <RerankFirstStageBanner data-testid="pipeline-editor-rerank-first-stage-banner" />
        )}
        <div className={rowStyles}>
          <Resizable
            defaultSize={{
              width: '50%',
              height: '100%',
            }}
            minWidth="300px"
            maxWidth="70%"
            enable={{
              right: true,
            }}
            handleComponent={{
              right: <ResizeHandle />,
            }}
          >
            <PipelineEditor />
          </Resizable>
          <div className={resultsStyles}>
            <PipelinePreview />
          </div>
        </div>
      </KeylineCard>
    </div>
  );
};

const mapState = (state: RootState) => {
  const { autoPreview } = state;
  return {
    isAutoPreview: !!autoPreview,
    showRerankFirstStageBanner: getIsRerankFirstStage(state),
  };
};

export default connect(mapState)(PipelineAsTextWorkspace);
