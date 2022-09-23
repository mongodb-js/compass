import React from 'react';
import {
  Icon,
  IconButton,
  css,
  spacing,
  uiColors,
  Body,
  withTheme
} from '@mongodb-js/compass-components';

import SavePipelineCard from './save-pipeline-card/save-pipeline-card';
import type { Pipeline } from '../../modules/pipeline';

const savedPipelinesStyles = css({
  width: '400px',
  display: 'flex',
  flexDirection: 'column',
});

const toolbarTitleStyles = css({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const titleStylesDark = css({
  color: uiColors.green.light2,
});

const titleStylesLight = css({
  color: uiColors.green.dark2,
});

const toolbarStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const toolbarContentStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[3],
});

const closeButtonStyles = css({
  marginLeft: 'auto',
  marginTop: spacing[2],
  marginRight: spacing[2],
});

const cardsContainerStyles = css({
  overflowY: 'scroll',
});

const emptyMessageStyles = css({
  fontStyle: 'italic',
  padding: spacing[3],
});

type SavedPipelinesProps = {
  darkMode?: boolean;
  deletePipeline: (pipelineId: string) => void;
  namespace: string;
  onSetShowSavedPipelines: (show: boolean) => void;
  restorePipelineFrom: (pipelineId: string) => void;
  restorePipelineModalToggle: (index: number) => void;
  savedPipelines: Pipeline[];
}

function UnthemedSavedPipelines({
  darkMode,
  namespace,
  restorePipelineModalToggle,
  restorePipelineFrom,
  deletePipeline,
  onSetShowSavedPipelines,
  savedPipelines,
}: SavedPipelinesProps) {
  return (
    <div className={savedPipelinesStyles}>
      <div className={toolbarStyles}>
        <div className={toolbarContentStyles}>
          <Body
            className={toolbarTitleStyles}
            id="saved-pipeline-header-title"
          >
            Saved Pipelines in <span
              className={darkMode ? titleStylesDark : titleStylesLight}
              data-testid="saved-pipeline-header-title-namespace"
              title={namespace}
            >{namespace}</span>
          </Body>
        </div>
        <IconButton
          className={closeButtonStyles}
          data-testid="saved-pipelines-close-button"
          onClick={() => onSetShowSavedPipelines(false)}
          aria-label="Close saved pipelines popover"
        >
          <Icon glyph="X" />
        </IconButton>
      </div>
      <div className={cardsContainerStyles}>
        {savedPipelines.map((pipeline: Pipeline) => (
          <SavePipelineCard
            restorePipelineModalToggle={restorePipelineModalToggle}
            restorePipelineFrom={restorePipelineFrom}
            deletePipeline={deletePipeline}
            name={pipeline.name}
            objectID={pipeline.id}
            key={pipeline.id}
          />
        ))}
        {savedPipelines.length === 0 && (
          <Body
            className={emptyMessageStyles}
            data-testid="saved-pipelines-empty-state"
          >
            No saved pipelines found.
          </Body>
        )}
      </div>
    </div>
  );
};

const SavedPipelines = withTheme(UnthemedSavedPipelines);

export { SavedPipelines };
