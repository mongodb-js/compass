import React from 'react';
import { css, spacing, palette } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';
import ResizeHandle from '../../resize-handle';
import type { RootState } from '../../../modules';

const containerStyles = css({
  display: 'flex',
  marginLeft: spacing[3],
  marginRight: spacing[3],
  height: '100%',

  // align with stage editor design
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '4px',
  boxShadow: `1px 1px 1px ${palette.gray.light2}`,
});

const noPreviewEditorStyles = css({
  flex: 1,
  width: '100%',
});

const resultsStyles = css({
  flex: 1,
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
      <div data-testid={containerDataTestId} className={containerStyles}>
        <div className={noPreviewEditorStyles}>
          <PipelineEditor />
        </div>
      </div>
    );
  }
  return (
    <div data-testid={containerDataTestId} className={containerStyles}>
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
  );
};

const mapState = ({ autoPreview }: RootState) => ({
  isAutoPreview: !!autoPreview,
});

export default connect(mapState)(PipelineAsTextWorkspace);
