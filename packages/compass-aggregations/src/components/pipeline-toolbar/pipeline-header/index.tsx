import React from 'react';
import { css, spacing, Body, Icon } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const pipelineTextAndStagesStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const pipelineStyles = css({
  display: 'flex',
  alignItems: 'center',
  marginRight: spacing[5],
});

const pipelineTextStyles = css({
  marginRight: spacing[1],
  marginLeft: spacing[1],
});

const openSavedPipelinesStyles = css({
  display: 'flex',
  marginRight: spacing[1],
  marginLeft: spacing[1],
});

const PipelineHeader: React.FunctionComponent<PipelineHeaderProps> = () => {
  return (
    <div className={containerStyles}>
      <div className={pipelineTextAndStagesStyles}>
        <div className={pipelineStyles}>
          <Body weight="medium" className={pipelineTextStyles}>
            Pipeline
          </Body>
          <div
            className={openSavedPipelinesStyles}
            aria-label="Open saved pipelines"
          >
            <Icon glyph="Folder" />
            <Icon glyph="CaretDown" />
          </div>
        </div>
        <PipelineStages />
      </div>
      <PipelineActions />
    </div>
  );
};

const connector = connect();
type PipelineHeaderProps = ConnectedProps<typeof connector>;
export default connector(PipelineHeader);
