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
import { css, spacing } from '@mongodb-js/compass-components';
import StageCreator from '../stage-creator/stage-creator';

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
  paddingRight: spacing[3],
  paddingLeft: spacing[3],
});

const stageContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

type PipelineBuilderUIWorkspaceProps = {
  stageIds: number[];
  editViewName?: string;
  isStageCreatorOpen: boolean;
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

type SortableItemProps = {
  idx: number;
  isLastStage: boolean;
} & Partial<StageProps>;

type SortableListProps = {
  stageIds: number[];
  onStageAddAfterEnd: (after?: number) => void;
};

const SortableItem = ({ idx, isLastStage, ...props }: SortableItemProps) => {
  return (
    <div className={stageContainerStyles}>
      <Stage index={idx} {...props}></Stage>
      {!isLastStage && <AddStage index={idx} variant="icon" />}
    </div>
  );
};

const SortableList = ({ stageIds }: SortableListProps) => {
  // It requires that you pass it a sorted array of the unique identifiers
  // associated with the elements that use the useSortable hook within it.
  // They must be strings or numbers bigger than 0.
  // It's important that the items prop passed to SortableContext
  // be sorted in the same order in which the items are rendered.
  const items = stageIds.map((id) => id + 1);
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {stageIds.map((id, index) => (
        <SortableItem
          key={`stage-${id}`}
          idx={index}
          isLastStage={index === stageIds.length - 1}
        />
      ))}
    </SortableContext>
  );
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<
  PipelineBuilderUIWorkspaceProps
> = ({
  stageIds,
  editViewName,
  isStageCreatorOpen,
  onStageMoveEnd,
  onStageAddAfterEnd,
}) => {
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
    <div data-testid="pipeline-builder-ui-workspace">
      <DndContext
        sensors={sensors}
        autoScroll={false}
        onDragEnd={({ active, over }) => {
          // If the user is dragging a use-case card
          if (active.data.current?.type === 'use-case') {
            if (over?.data.current?.type === 'placeholder') {
              const useCaseId = active.id;
              const afterStageId = over.id;
              console.log(
                `Create card: ${useCaseId} after stage: ${afterStageId}`
              );
              return;
            }
          } else {
            if (over && active.id !== over.id) {
              onSortEnd({ oldIndex: +active.id, newIndex: +over.id });
            }
          }
        }}
      >
        <div
          style={{
            display: 'grid',
            width: '100%',
            gridTemplateColumns: isStageCreatorOpen ? '66% 34%' : '100%',
            // todo: remove the scroll container.
          }}
        >
          <div className={pipelineWorkspaceContainerStyles}>
            <div className={pipelineWorkspaceStyles}>
              {editViewName && (
                <ModifySourceBanner editViewName={editViewName} />
              )}
              <PipelineBuilderInputDocuments />
              {stageIds.length !== 0 && <AddStage variant="icon" index={-1} />}
              <SortableList
                stageIds={stageIds}
                onStageAddAfterEnd={onStageAddAfterEnd}
              />
              <AddStage variant="button" />
            </div>
          </div>
          {isStageCreatorOpen && <StageCreator />}
        </div>
      </DndContext>
    </div>
  );
};

const mapState = (state: RootState) => {
  return {
    stageIds: state.pipelineBuilder.stageEditor.stageIds,
    editViewName: state.editViewName,
    isStageCreatorOpen: state.stageCreator.isPanelOpen,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
