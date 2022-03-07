import React from 'react';
import { css, spacing, uiColors } from '@mongodb-js/compass-components';

import PipelineTitle from './pipeline-title';
import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';
import PipelineSettings from './pipeline-settings';

const toolbarContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  paddingTop: spacing[2],
  paddingRight: spacing[5],
  paddingBottom: spacing[2],
  paddingLeft: spacing[3],
  borderBottom: `1px solid`,
  borderBottomColor: uiColors.gray.light2,
});

const stagesAndActionRowStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const PipelineToolbar: React.FunctionComponent = () => {
  return (
    <div className={toolbarContainerStyles}>
      <PipelineTitle />
      <div className={stagesAndActionRowStyles}>
        <PipelineStages />
        <PipelineActions />
      </div>
      <PipelineSettings />
    </div>
  );
};

export default PipelineToolbar;
