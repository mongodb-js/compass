import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import Stage from '../stage';
import type { StageProps } from '../stage';
import PipelineBuilderInputDocuments from '../pipeline-builder-input-documents';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import {
  addStage,
  moveStage,
} from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const pipelineWorkspaceContainerStyles = css({
  position: 'relative',
  width: '100%',
  height: '100%',
});

const pipelineWorkspaceStyles = css({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  flexGrow: 1,
});

const stageContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  '&.dragging .add-stage-button': {
    visibility: 'hidden',
  },
});

type PipelineBuilderUIWorkspaceProps = {
  stageIds: number[];
  editViewName?: string;
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

type SortableItemProps = {
  idx: number;
  isLastStage: boolean;
  onStageAddAfter: (after?: number) => void;
} & Partial<StageProps>;

type SortableListProps = {
  stageIds: number[];
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

const SortableItem = ({
  idx,
  isLastStage,
  onStageAddAfter,
  ...props
}: SortableItemProps) => {
  return (
    <div className={stageContainerStyles}>
      <Stage index={idx} {...props}></Stage>
      {!isLastStage && (
        <div className="add-stage-button">
          <AddStage onAddStage={onStageAddAfter} variant="icon" />
        </div>
      )}
    </div>
  );
};

const SortableList = ({
  stageIds,
  onStageMoveEnd,
  onStageAddAfterEnd,
}: SortableListProps) => {
  // It requires that you pass it a sorted array of the unique identifiers
  // associated with the elements that use the useSortable hook within it.
  // They must be strings or numbers bigger than 0.
  // It's important that the items prop passed to SortableContext
  // be sorted in the same order in which the items are rendered.
  const items = stageIds.map((id) => id + 1);
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
      const from = stageIds.findIndex((id) => id + 1 === oldIndex);
      const to = stageIds.findIndex((id) => id + 1 === newIndex);
      onStageMoveEnd(from, to);
    },
    [onStageMoveEnd, stageIds]
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
        {stageIds.map((id, index) => (
          <SortableItem
            key={`stage-${id}`}
            idx={index}
            isLastStage={index === stageIds.length - 1}
            onStageAddAfter={() => onStageAddAfterEnd(index)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<
  PipelineBuilderUIWorkspaceProps
> = ({ stageIds, editViewName, onStageMoveEnd, onStageAddAfterEnd }) => {
  return (
    <div data-testid="pipeline-builder-ui-workspace">
      <div className={pipelineWorkspaceContainerStyles}>
        <div className={pipelineWorkspaceStyles}>
          {editViewName && <ModifySourceBanner editViewName={editViewName} />}
          <PipelineBuilderInputDocuments />
          {stageIds.length !== 0 && (
            <AddStage
              onAddStage={() => onStageAddAfterEnd(-1)}
              variant="icon"
            />
          )}
          <SortableList
            stageIds={stageIds}
            onStageMoveEnd={onStageMoveEnd}
            onStageAddAfterEnd={onStageAddAfterEnd}
          />
          <AddStage onAddStage={onStageAddAfterEnd} variant="button" />
        </div>
      </div>
    </div>
  );
};

const mapState = (state: RootState) => {
  return {
    stageIds: state.pipelineBuilder.stageEditor.stageIds,
    editViewName: state.editViewName,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
