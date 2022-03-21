import React from 'react';
import { css, spacing, Body, Icon } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import type { Dispatch } from 'redux';

import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';
import {
  getSavedPipelines,
  savedPipelinesListToggle,
} from '../../../modules/saved-pipeline';

const containerStyles = css({
  display: 'grid',
  gap: spacing[4],
  gridTemplateAreas: '"pipelineTextAndOpen pipelineStages pipelineAction"',
  gridTemplateColumns: 'min-content',
  alignItems: 'center',
});

const pipelineTextAndOpenStyles = css({
  display: 'flex',
  gridArea: 'pipelineTextAndOpen',
  gap: spacing[2],
});
const openSavedPipelinesStyles = css({
  border: 'none',
  backgroundColor: 'transparent',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
});

const pipelineStagesStyles = css({
  gridArea: 'pipelineStages',
  display: 'flex',
});
const pipelineActionStyles = css({
  gridArea: 'pipelineAction',
  justifySelf: 'end',
  display: 'flex',
});

const PipelineHeader: React.FunctionComponent<PipelineHeaderProps> = ({
  onShowSavedPipelines,
}) => {
  return (
    <div className={containerStyles} data-testid="pipeline-header">
      <div className={pipelineTextAndOpenStyles}>
        <Body weight="medium">Pipeline</Body>
        <button
          data-testid="pipeline-toolbar-open-pipelines-button"
          onClick={() => onShowSavedPipelines()}
          className={openSavedPipelinesStyles}
          aria-label="Open saved pipelines"
        >
          <Icon glyph="Folder" />
          <Icon glyph="CaretDown" />
        </button>
      </div>
      <div className={pipelineStagesStyles}>
        <PipelineStages />
      </div>
      <div className={pipelineActionStyles}>
        <PipelineActions />
      </div>
    </div>
  );
};

const mapDispatch = (dispatch: Dispatch) => ({
  onShowSavedPipelines: () => {
    // todo: fix dispatch
    dispatch(getSavedPipelines());
    dispatch(savedPipelinesListToggle(1));
  },
});

const connector = connect(null, mapDispatch);
type PipelineHeaderProps = ConnectedProps<typeof connector>;
export default connector(PipelineHeader);
