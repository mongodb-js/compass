import React, { useCallback, useState } from 'react';
import {
  css,
  spacing,
  palette,
  Body,
  useDarkMode
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { SavePipelineCard } from './saved-pipeline-card';
import { OpenPipelineConfirmationModal, DeletePipelineConfirmationModal } from './saved-pipeline-confirmation-modals';
import { openPipelineById, deletePipelineById } from '../../modules/saved-pipeline';
import { type EditorViewType, mapPipelineModeToEditorViewType } from '../../modules/pipeline-builder/builder-helpers';
import { type RootState } from '../../modules';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const savedPipelinesStyles = css({
  width: '400px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
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
  flex: 1
});

const emptyMessageStyles = css({
  fontStyle: 'italic',
  padding: spacing[3],
});

type SavedPipelinesProps = {
  namespace: string;
  savedPipelines: { id: string; name: string }[];
  editor_view_type: EditorViewType;
  onOpenPipeline: (pipelineId: string) => void;
  onDeletePipeline: (pipelineId: string) => void;
};

export const SavedPipelines = ({
  namespace,
  savedPipelines,
  editor_view_type,
  onOpenPipeline,
  onDeletePipeline,
}: SavedPipelinesProps) => {
  const darkMode = useDarkMode();
  const [deletePipelineId, setDeletePipelineId] = useState<string | null>(null);
  const [openPipelineId, setOpenPipelineId] = useState<string | null>(null);

  const onOpenConfirm = useCallback((id: string) => {
    track('Aggregation Opened', {
      id,
      editor_view_type,
      screen: 'aggregations',
    });
    onOpenPipeline(id);
  }, [editor_view_type, onOpenPipeline]);

  const onDeleteConfirm = useCallback((id: string) => {
    track('Aggregation Deleted', {
      id,
      editor_view_type,
      screen: 'aggregations',
    });
    onDeletePipeline(id);
    setDeletePipelineId(null);
  }, [editor_view_type, onDeletePipeline, setDeletePipelineId]);

  return (
    <div className={savedPipelinesStyles} data-testid="saved-pipelines">
      <div className={toolbarContentStyles}>
        <Body
          className={toolbarTitleStyles}
          data-testid="saved-pipeline-header-title"
          id="saved-pipeline-header-title"
        >
          Saved Pipelines in <span
            className={darkMode ? titleStylesDark : titleStylesLight}
            title={namespace}
          >{namespace}</span>
        </Body>
      </div>
      <div className={cardsContainerStyles}>
        {savedPipelines.map((pipeline) => (
          <SavePipelineCard
            key={pipeline.id}
            name={pipeline.name ?? ''}
            id={pipeline.id}
            onOpenPipeline={() => setOpenPipelineId(pipeline.id)}
            onDeletePipeline={() => setDeletePipelineId(pipeline.id)}
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
      <OpenPipelineConfirmationModal
        isOpen={!!openPipelineId}
        onCancel={() => setOpenPipelineId(null)}
        onConfirm={() => onOpenConfirm(openPipelineId as string)}
      />
      <DeletePipelineConfirmationModal
        isOpen={!!deletePipelineId}
        onCancel={() => setDeletePipelineId(null)}
        onConfirm={() => onDeleteConfirm(deletePipelineId as string)}
      />
    </div>
  );
};
const mapState = (state: RootState) => ({
  editor_view_type: mapPipelineModeToEditorViewType(
    state.pipelineBuilder.pipelineMode
  ),
  namespace: state.namespace,
  savedPipelines: state.savedPipeline.pipelines,
});

const mapDispatch = {
  onOpenPipeline: openPipelineById,
  onDeletePipeline: deletePipelineById,
}

export default connect(mapState, mapDispatch)(SavedPipelines);

