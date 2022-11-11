import React from 'react';
import { css, spacing, palette } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import PipelineEditor from './pipeline-editor';
import PipelinePreview from './pipeline-preview';
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

const editorStyles = css({
  flex: 1,
  minWidth: '50%',
  borderRight: `2px solid ${palette.gray.light2}`,
});

const resultsStyles = css({
  flex: 1,
  minWidth: '50%',
});

type PipelineAsTextWorkspaceProps = {
  isAutoPreview: boolean;
}

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({
  isAutoPreview
}) => {
  return (
    <div data-testid="pipeline-as-text-workspace" className={containerStyles}>
      <div className={editorStyles}>
        <PipelineEditor />
      </div>
      {isAutoPreview && <div className={resultsStyles}>
        <PipelinePreview />
      </div>}
    </div>
  );
};


const mapState = ({
  autoPreview
}: RootState) => ({
  isAutoPreview: !!autoPreview,
});

export default connect(mapState)(PipelineAsTextWorkspace);

