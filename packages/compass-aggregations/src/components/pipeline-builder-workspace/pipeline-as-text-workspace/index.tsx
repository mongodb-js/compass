import React from 'react';
import { css, KeylineCard, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';
import ResizeHandle from '../../resize-handle';
import type { RootState } from '../../../modules';

const containerStyles = css({
  display: 'flex',
  height: '100%',
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
  paddingBottom: spacing[3],
  width: '100%',
  overflow: 'auto',
});

type PipelineAsTextWorkspaceProps = {
  isAutoPreview: boolean;
};

const containerDataTestId = 'pipeline-as-text-workspace';

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({ isAutoPreview }) => {
  if (!isAutoPreview) {
    return (
      <div className={workspaceContainerStyles}>
        <KeylineCard
          data-testid={containerDataTestId}
          className={containerStyles}
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
        className={containerStyles}
      >
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
      </KeylineCard>
    </div>
  );
};

const mapState = ({ autoPreview }: RootState) => ({
  isAutoPreview: !!autoPreview,
});

export default connect(mapState)(PipelineAsTextWorkspace);
