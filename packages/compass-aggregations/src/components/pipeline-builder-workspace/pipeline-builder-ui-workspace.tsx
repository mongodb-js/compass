import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import Stage from '../stage';
import PipelineBuilderInputDocuments from '../pipeline-builder-input-documents';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import type { StageIdAndType } from '../../modules/pipeline-builder/stage-editor';
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
import Wizard from '../stage-wizard';

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
});

type PipelineBuilderUIWorkspaceProps = {
  stagesIdAndType: StageIdAndType[];
  editViewName?: string;
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

type SortableItemProps = {
  idx: number;
  isLastStage: boolean;
  onStageAddAfter: (after?: number) => void;
  type: StageIdAndType['type'];
};

type SortableListProps = {
  stagesIdAndType: StageIdAndType[];
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

const SortableItem = ({
  idx,
  isLastStage,
  onStageAddAfter,
  type,
}: SortableItemProps) => {
  return (
    <div className={stageContainerStyles}>
      {type === 'stage' ? <Stage index={idx} /> : <Wizard index={idx} />}
      {!isLastStage && <AddStage onAddStage={onStageAddAfter} variant="icon" />}
    </div>
  );
};

const SortableList = ({
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
            idx={index}
            type={type}
            isLastStage={index === stagesIdAndType.length - 1}
            onStageAddAfter={() => onStageAddAfterEnd(index)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<
  PipelineBuilderUIWorkspaceProps
> = ({ stagesIdAndType, editViewName, onStageMoveEnd, onStageAddAfterEnd }) => {
  return (
    <div data-testid="pipeline-builder-ui-workspace">
      <div className={pipelineWorkspaceContainerStyles}>
        <div className={pipelineWorkspaceStyles}>
          {editViewName && <ModifySourceBanner editViewName={editViewName} />}
          <PipelineBuilderInputDocuments />
          {stagesIdAndType.length !== 0 && (
            <AddStage
              onAddStage={() => onStageAddAfterEnd(-1)}
              variant="icon"
            />
          )}
          <SortableList
            stagesIdAndType={stagesIdAndType}
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
    stagesIdAndType: state.pipelineBuilder.stageEditor.stagesIdAndType,
    editViewName: state.editViewName,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
