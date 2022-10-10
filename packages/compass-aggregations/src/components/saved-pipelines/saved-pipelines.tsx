import React from 'react';
import {
  Icon,
  IconButton,
  css,
  spacing,
  palette,
  Body,
  withTheme
} from '@mongodb-js/compass-components';
import SavePipelineCard from './saved-pipeline-card';

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
  color: palette.green.light2,
});

const titleStylesLight = css({
  color: palette.green.dark2,
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
  namespace: string;
  onToggleSavedPipelines: (show: boolean) => void;
  savedPipelines: { id: string; name: string }[];
};

function UnthemedSavedPipelines({
  darkMode,
  namespace,
  onToggleSavedPipelines,
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
          onClick={() => {
            onToggleSavedPipelines(false);
          }}
          aria-label="Close saved pipelines popover"
        >
          <Icon glyph="X" />
        </IconButton>
      </div>
      <div className={cardsContainerStyles}>
        {savedPipelines.map((pipeline) => (
          <SavePipelineCard
            key={pipeline.id}
            name={pipeline.name ?? ''}
            id={pipeline.id}
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
