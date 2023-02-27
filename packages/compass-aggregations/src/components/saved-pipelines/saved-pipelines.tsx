import React from 'react';
import {
  css,
  spacing,
  palette,
  Body,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { SavePipelineCard } from './saved-pipeline-card';
import {
  confirmOpenPipeline,
  confirmDeletePipeline,
} from '../../modules/saved-pipeline';
import { type RootState } from '../../modules';

const savedPipelinesStyles = css({
  width: '400px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
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

const toolbarContentStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[3],
  paddingRight: spacing[5], // Extra right padding to account for close button.
});

const cardsContainerStyles = css({
  overflowY: 'auto',
  flex: 1,
});

const emptyMessageStyles = css({
  fontStyle: 'italic',
  padding: spacing[3],
});

type SavedPipelinesProps = {
  namespace: string;
  savedPipelines: { id: string; name: string }[];
  onOpenPipeline: (pipelineId: string) => void;
  onDeletePipeline: (pipelineId: string) => void;
};

export const SavedPipelines = ({
  namespace,
  savedPipelines,
  onOpenPipeline,
  onDeletePipeline,
}: SavedPipelinesProps) => {
  const darkMode = useDarkMode();
  return (
    <div className={savedPipelinesStyles} data-testid="saved-pipelines">
      <div className={toolbarContentStyles}>
        <Body
          className={toolbarTitleStyles}
          data-testid="saved-pipeline-header-title"
          id="saved-pipeline-header-title"
        >
          Saved Pipelines in{' '}
          <span
            className={darkMode ? titleStylesDark : titleStylesLight}
            title={namespace}
          >
            {namespace}
          </span>
        </Body>
      </div>
      <div className={cardsContainerStyles}>
        {savedPipelines.map((pipeline) => (
          <SavePipelineCard
            key={pipeline.id}
            name={pipeline.name ?? ''}
            id={pipeline.id}
            onOpenPipeline={() => onOpenPipeline(pipeline.id)}
            onDeletePipeline={() => onDeletePipeline(pipeline.id)}
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
const mapState = (state: RootState) => ({
  namespace: state.namespace,
  savedPipelines: state.savedPipeline.pipelines,
});

const mapDispatch = {
  onOpenPipeline: confirmOpenPipeline,
  onDeletePipeline: confirmDeletePipeline,
};

export default connect(mapState, mapDispatch)(SavedPipelines);
