import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

import AddStage from '../../add-stage';
import { SortableList } from './sortable-list';
import ResizeHandle from '../../resize-handle';
import type { RootState } from '../../../modules';
import {
  addStage,
  moveStage,
} from '../../../modules/pipeline-builder/stage-editor';
import ModifySourceBanner from '../../modify-source-banner';
import { css, spacing } from '@mongodb-js/compass-components';
import AggregationSidePanel from '../../aggregation-side-panel';
import { addWizard } from '../../../modules/pipeline-builder/stage-editor';
import PipelineBuilderInputDocuments from '../../pipeline-builder-input-documents';
import { STAGE_WIZARD_USE_CASES } from '../../aggregation-side-panel/stage-wizard-use-cases';
import { UseCaseCardLayout } from '../../aggregation-side-panel/stage-wizard-use-cases/use-case-card';
import type { StageIdAndType } from '../../../modules/pipeline-builder/stage-editor';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const pipelineWorkspaceContainerStyles = css({
  position: 'relative',
  height: '100%',
  paddingBottom: spacing[3],
  width: '100%',
  overflow: 'auto',
});

const pipelineWorkspaceStyles = css({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  flexGrow: 1,
});

type PipelineBuilderUIWorkspaceProps = {
  stagesIdAndType: StageIdAndType[];
  editViewName?: string;
  isSidePanelOpen: boolean;
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
  onUseCaseDropped: (
    useCaseId: string,
    stageOperator: string,
    after?: number
  ) => void;
};

const isUseCaseDragEvent = (event: DragEndEvent | DragStartEvent): boolean => {
  const { active } = event;
  return active.data.current?.type === 'use-case';
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<
  PipelineBuilderUIWorkspaceProps
> = ({
  stagesIdAndType,
  editViewName,
  isSidePanelOpen,
  onStageMoveEnd,
  onStageAddAfterEnd,
  onUseCaseDropped,
}) => {
  // State used to keep a reference of the use-case being dragged from
  // side panel. This state is required to:
  //  - render the to-be dragged use-case in a DragOverlay
  //  - and to conditionally render drop markers.
  const [draggedUseCaseId, setDraggedUseCaseId] = useState('');
  const draggedUseCase = useMemo(() => {
    return STAGE_WIZARD_USE_CASES.find(({ id }) => id === draggedUseCaseId);
  }, [draggedUseCaseId]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating.
      // Slight distance prevents sortable logic messing with
      // interactive elements in the handler toolbar component.
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement.
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // We need to bring our drop markers in DOM for them to detect wether a
  // use-case was dropped over them or not. The reason we conditionally render
  // our drop markers is because if not done this way it interferes with
  // sortable context and hooks, making them un-predictable.
  const renderUseCaseDropMarkers = !!draggedUseCaseId;

  const handleUseCaseDropped = useCallback(
    (event: DragEndEvent) => {
      const { over } = event;
      setDraggedUseCaseId('');
      if (draggedUseCase) {
        track('Aggregation Use Case Added', {
          drag_and_drop: true,
        });
        onUseCaseDropped(
          draggedUseCase.id,
          draggedUseCase.stageOperator,
          over?.id as number | undefined
        );
      }
    },
    [draggedUseCase, onUseCaseDropped]
  );

  const handleSortEnd = useCallback(
    ({ oldIndex, newIndex }) => {
      const from = stagesIdAndType.findIndex(({ id }) => id + 1 === oldIndex);
      const to = stagesIdAndType.findIndex(({ id }) => id + 1 === newIndex);
      onStageMoveEnd(from, to);
    },
    [onStageMoveEnd, stagesIdAndType]
  );

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (isUseCaseDragEvent(event)) {
          handleUseCaseDropped(event);
        } else if (
          over &&
          over.data.current?.sortable &&
          active.id !== over.id
        ) {
          handleSortEnd({ oldIndex: +active.id, newIndex: +over.id });
        }
      }}
      onDragStart={(event) => {
        if (isUseCaseDragEvent(event)) {
          setDraggedUseCaseId(event.active.id as string);
        }
      }}
    >
      <div
        data-testid="pipeline-builder-ui-workspace"
        className={pipelineWorkspaceContainerStyles}
      >
        <div className={pipelineWorkspaceStyles}>
          {editViewName && <ModifySourceBanner editViewName={editViewName} />}
          <PipelineBuilderInputDocuments />
          {stagesIdAndType.length !== 0 && (
            <AddStage
              variant="icon"
              index={-1}
              onAddStage={() => onStageAddAfterEnd(-1)}
              renderUseCaseDropMarker={renderUseCaseDropMarkers}
            />
          )}
          <SortableList
            renderUseCaseDropMarker={renderUseCaseDropMarkers}
            stagesIdAndType={stagesIdAndType}
            onStageAddAfterEnd={onStageAddAfterEnd}
          />
          <AddStage
            variant="button"
            index={stagesIdAndType.length - 1}
            onAddStage={onStageAddAfterEnd}
            renderUseCaseDropMarker={renderUseCaseDropMarkers}
          />
        </div>
      </div>
      {isSidePanelOpen && (
        <Resizable
          defaultSize={{ width: '25%', height: 'auto' }}
          minWidth={'15%'}
          maxWidth={'50%'}
          enable={{ left: true }}
          handleComponent={{ left: <ResizeHandle /> }}
          handleStyles={{
            left: {
              left: '-1px', // default is -5px
              // The sidepanel container is a card with radius.
              // Having padding top, cleans the UI.
              paddingTop: spacing[2],
            },
          }}
        >
          <AggregationSidePanel />
        </Resizable>
      )}
      {draggedUseCase ? (
        <DragOverlay>
          <UseCaseCardLayout
            id={draggedUseCase.id}
            title={draggedUseCase.title}
            stageOperator={draggedUseCase.stageOperator}
          />
        </DragOverlay>
      ) : null}
    </DndContext>
  );
};

const mapState = (state: RootState) => {
  return {
    stagesIdAndType: state.pipelineBuilder.stageEditor.stagesIdAndType,
    editViewName: state.editViewName,
    isSidePanelOpen: state.sidePanel.isPanelOpen,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
  onUseCaseDropped: addWizard,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
