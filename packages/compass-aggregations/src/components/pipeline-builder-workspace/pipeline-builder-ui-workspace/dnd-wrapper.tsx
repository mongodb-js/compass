import React, { useCallback, useState } from 'react';
import {
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

import {
  indexFromDroppableId,
  isValidDroppableId,
} from '../../use-case-droppable-area';
import { UseCaseCardLayout } from '../../aggregation-side-panel/stage-wizard-use-cases/use-case-card';
import type { PipelineBuilderUIWorkspaceProps } from '.';
import type { DraggedUseCase } from '../../aggregation-side-panel/stage-wizard-use-cases/use-case-card';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

// Types
type PipelineBuilderDndWrapperProps = {
  children: React.ReactNode;
} & Pick<
  PipelineBuilderUIWorkspaceProps,
  'stagesIdAndType' | 'onStageMoveEnd' | 'onUseCaseDropped'
>;

// Helpers
const isUseCaseDragStartEvent = (event: DragStartEvent): boolean => {
  const { active } = event;
  return active.data.current?.type === 'use-case';
};

const isUseCaseDragEndEvent = (event: DragEndEvent): boolean => {
  const { active, over } = event;
  return (
    active.data.current?.type === 'use-case' &&
    isValidDroppableId(String(over?.id))
  );
};

// Component
const PipelineBuilderDndWrapper = ({
  children,
  stagesIdAndType,
  onStageMoveEnd,
  onUseCaseDropped,
}: PipelineBuilderDndWrapperProps) => {
  const [draggedUseCase, setDraggedUseCase] = useState<DraggedUseCase | null>(
    null
  );

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

  const handleUseCaseDropped = useCallback(
    (event: DragEndEvent) => {
      const { over } = event;
      const overId = indexFromDroppableId(String(over?.id));
      if (draggedUseCase && overId !== null) {
        track('Aggregation Use Case Added', {
          drag_and_drop: true,
        });
        onUseCaseDropped(
          draggedUseCase.id,
          draggedUseCase.stageOperator,
          overId
        );
      }
      setDraggedUseCase(null);
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
        if (isUseCaseDragEndEvent(event)) {
          handleUseCaseDropped(event);
        } else if (
          !isUseCaseDragStartEvent(event) &&
          over &&
          over.data.current?.sortable &&
          active.id !== over.id
        ) {
          handleSortEnd({ oldIndex: +active.id, newIndex: +over.id });
        }
      }}
      onDragStart={(event) => {
        if (isUseCaseDragStartEvent(event)) {
          setDraggedUseCase(
            event.active.data.current?.draggedUseCase as DraggedUseCase
          );
        }
      }}
    >
      {children}
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

export default PipelineBuilderDndWrapper;
