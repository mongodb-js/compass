import React from 'react';
import { css, spacing, uiColors } from '@mongodb-js/compass-components';

import PipelineTitle from './pipeline-title';
import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';
import PipelineSettings from './pipeline-settings';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  paddingTop: spacing[2],
  paddingRight: spacing[5],
  paddingBottom: spacing[2],
  paddingLeft: spacing[3],
  borderBottom: `1px solid`,
  borderBottomColor: uiColors.gray.light2,
});

const stagesAndActionStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const pipelineSettingsStyles = css({
  paddingTop: spacing[1],
  paddingRight: spacing[5],
  paddingBottom: spacing[2],
  paddingLeft: spacing[3],
});

const PipelineToolbar: React.FunctionComponent = () => {
  return (
    <div>
      <div className={containerStyles}>
        <PipelineTitle />
        <div className={stagesAndActionStyles}>
          <PipelineStages />
          <PipelineActions />
        </div>
      </div>
      <div className={pipelineSettingsStyles}>
        <PipelineSettings />
      </div>
    </div>
  );
};

export default PipelineToolbar;
