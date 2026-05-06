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

const cardStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const contentRowStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
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
  isRerankFirstStage: boolean;
};

const containerDataTestId = 'pipeline-as-text-workspace';

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({ isAutoPreview, isRerankFirstStage }) => {
  if (!isAutoPreview) {
    return (
      <div className={workspaceContainerStyles}>
        <KeylineCard data-testid={containerDataTestId} className={cardStyles}>
          {isRerankFirstStage && (
            <RerankFirstStageBanner data-testid="pipeline-editor-rerank-first-stage-banner" />
          )}
          <div className={contentRowStyles}>
            <div className={noPreviewEditorStyles}>
              <PipelineEditor />
            </div>
          </div>
        </KeylineCard>
      </div>
    );
  }
  return (
    <div className={workspaceContainerStyles}>
      <KeylineCard data-testid={containerDataTestId} className={cardStyles}>
        {isRerankFirstStage && (
          <RerankFirstStageBanner data-testid="pipeline-editor-rerank-first-stage-banner" />
        )}
        <div className={contentRowStyles}>
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

const mapState = (state: RootState) => ({
  isAutoPreview: !!state.autoPreview,
  isRerankFirstStage: getIsRerankFirstStage(state),
});

export default connect(mapState)(PipelineAsTextWorkspace);
