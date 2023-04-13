import React, { useCallback } from 'react';
import type { StageIdAndType } from '../../../modules/pipeline-builder/stage-editor';
import { css } from '@mongodb-js/compass-components';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

import Stage from '../../stage';
import Wizard from '../../stage-wizard';
import AddStage from '../../add-stage';

const sortableItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

export type SortableProps = {
  style?: React.CSSProperties;
  setNodeRef?: (node: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
};

type SortableItemProps = {
  id: number;
  index: number;
  isLastStage: boolean;
  onStageAddAfter: (after?: number) => void;
  type: StageIdAndType['type'];
};

const SortableItem = ({
  id,
  index,
  isLastStage,
  onStageAddAfter,
  type,
}: SortableItemProps) => {
  const { setNodeRef, transform, transition, listeners, isDragging } =
    useSortable({
      id: id + 1,
    });
  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const sortableProps: SortableProps = {
    setNodeRef,
    style,
    listeners,
  };

  return (
    <div className={sortableItemStyles}>
      {type === 'stage' ? (
        <Stage index={index} {...sortableProps} />
      ) : (
        <Wizard index={index} {...sortableProps} />
      )}
      {!isLastStage && <AddStage onAddStage={onStageAddAfter} variant="icon" />}
    </div>
  );
};

type SortableListProps = {
  stagesIdAndType: StageIdAndType[];
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

export const SortableList = ({
  stagesIdAndType,
  onStageMoveEnd,
  onStageAddAfterEnd,
}: SortableListProps) => {
  // It requires that you pass it a sorted array of the unique identifiers
  // associated with the elements that use the useSortable hook within it.
  // They must be strings or numbers bigger than 0.
  // It's important that the items prop passed to SortableContext
  // be sorted in the same order in which the items are rendered.
  const items = stagesIdAndType.map(({ id }) => id + 1);
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

  const onSortEnd = useCallback(
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
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          onSortEnd({ oldIndex: +active.id, newIndex: +over.id });
        }
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {stagesIdAndType.map(({ id, type }, index) => (
          <SortableItem
            key={`stage-${id}`}
            id={id}
            index={index}
            type={type}
            isLastStage={index === stagesIdAndType.length - 1}
            onStageAddAfter={() => onStageAddAfterEnd(index)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
