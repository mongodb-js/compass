import React from 'react';
import { css, KeylineCard, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';
import ResizeHandle from '../../resize-handle';
import { RerankTokensBanner } from '../../rerank-tokens-banner';
import { usePreference } from 'compass-preferences-model/provider';
import type { RootState } from '../../../modules';

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
  pipelineText: string;
};

const containerDataTestId = 'pipeline-as-text-workspace';

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({ isAutoPreview, pipelineText }) => {
  const enableRerank = usePreference('enableRerank');
  const showRerankTokensBanner =
    enableRerank && pipelineText.includes('$rerank') && isAutoPreview;

  if (!isAutoPreview) {
    return (
      <div className={workspaceContainerStyles}>
        <KeylineCard
          data-testid={containerDataTestId}
          className={outerContainerStyles}
        >
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
        {showRerankTokensBanner && (
          <RerankTokensBanner data-testid="pipeline-editor-rerank-tokens-banner" />
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

const mapState = ({
  autoPreview,
  pipelineBuilder: {
    textEditor: {
      pipeline: { pipelineText },
    },
  },
}: RootState) => ({
  isAutoPreview: !!autoPreview,
  pipelineText,
});

export default connect(mapState)(PipelineAsTextWorkspace);
