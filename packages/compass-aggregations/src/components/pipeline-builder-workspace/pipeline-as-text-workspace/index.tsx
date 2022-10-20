import React from 'react';
import { css, spacing, palette } from '@mongodb-js/compass-components';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';

const containerStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  marginLeft: spacing[3],
  marginRight: spacing[3],

  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '4px',
  boxShadow: `1px 1px 1px ${palette.gray.light2}`,
  height: '100%',
});

const editorStyles = css({
  flex: 1,
  overflow: 'auto',
  borderRight: `2px solid ${palette.gray.light2}`,
});

const resultsStyles = css({
  flex: 1,
});

export const PipelineAsTextWorkspace = () => {
  return (
    <div data-testid="pipeline-as-text-workspace" className={containerStyles}>
      <div className={editorStyles}>
        <PipelineEditor />
      </div>
      <div className={resultsStyles}>
        <PipelinePreview />
      </div>
    </div>
  );
};

export default PipelineAsTextWorkspace;
