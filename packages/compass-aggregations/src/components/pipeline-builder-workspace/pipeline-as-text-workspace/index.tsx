import React from 'react';
import { css, spacing, palette } from '@mongodb-js/compass-components';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';

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

const editorStyles = css({
  flex: 1,
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
