import React from 'react';
import { connect } from 'react-redux';
import { css, spacing } from '@mongodb-js/compass-components';

import PipelineTextEditor from './text-editor';

const containerStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  marginBottom: spacing[3],
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1],
});

const editorStyles = css({
  flex: 1,
  overflow: 'scroll',
});

const resultsStyles = css({
  flex: 1,
  overflow: 'scroll',
});

export const PipelineAsTextWorkspace: React.FunctionComponent = () => {
  return (
    <div data-testid="pipeline-as-text-workspace" className={containerStyles}>
      <div className={editorStyles}>
        <PipelineTextEditor />
      </div>
      <div className={resultsStyles}></div>
    </div>
  );
};

export default connect()(PipelineAsTextWorkspace);
