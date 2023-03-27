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
import { AggregationLibraryPanel } from './aggregation-library-panel';
import { DroppableMarker } from './droppable-marker';
import { palette } from '@leafygreen-ui/palette';

const pipelineBuilderUiStyles = css({
  // position: 'relative'
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
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
  isAggregationLibraryOpen: boolean;
};

type SortableItemProps = {
  idx: number;
  isLastStage: boolean;
  onStageAddAfter: (after?: number) => void;
} & Partial<StageProps>;

type SortableListProps = {
  stageIds: number[];
  onStageAddAfterEnd: (after?: number) => void;
};

const StageCreator = (props: { index: number }) => {
  const stageCreatorStyles = css({
    display: 'flex',
    height: '100px',
    borderRadius: '8px',
    padding: '15px',
  });

  return <div className={stageCreatorStyles}>{props.index}</div>;
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
        <AddStage index={idx} onAddStage={onStageAddAfter} variant="icon" />
      )}
    </div>
  );
};

const SortableList = ({ stageIds, onStageAddAfterEnd }: SortableListProps) => {
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
          onStageAddAfter={() => onStageAddAfterEnd(index)}
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
  onStageMoveEnd,
  onStageAddAfterEnd,
  isAggregationLibraryOpen,
}) => {
  const AGG_PANEL_WIDTH = 400;

  const pipelineWorkspaceContainerStyles = css({
    width: isAggregationLibraryOpen
      ? `calc(100% - ${AGG_PANEL_WIDTH}px)`
      : '100%',
    height: '100%',
    overflowY: isAggregationLibraryOpen ? 'scroll' : 'unset',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  });

  const aggregationPanelStyles = css({
    width: `${AGG_PANEL_WIDTH}px`,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    padding: spacing[3],
    flexDirection: 'column',
    display: isAggregationLibraryOpen ? 'flex' : 'none',
    gap: spacing[2],
    background: palette.white,
  });

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
    <div
      className={pipelineBuilderUiStyles}
      data-testid="pipeline-builder-ui-workspace"
    >
      <DndContext
        sensors={sensors}
        autoScroll={false}
        onDragEnd={({ active, over }) => {
          console.log(active, over);
          const activeElementId = active.id.toString();
          const isUseCaseDragAndDrop = activeElementId.startsWith('usecase-');
          if (isUseCaseDragAndDrop) {
            // Update the redux slice for stages
            // with an entry for stage wizard state
            //
          } else {
            if (over && active.id !== over.id) {
              onSortEnd({ oldIndex: +active.id, newIndex: +over.id });
            }
          }
        }}
      >
        <div className={pipelineWorkspaceContainerStyles}>
          <div className={pipelineWorkspaceStyles}>
            {editViewName && <ModifySourceBanner editViewName={editViewName} />}
            <PipelineBuilderInputDocuments />
            {stageIds.length !== 0 && (
              <AddStage
                index={0}
                onAddStage={() => onStageAddAfterEnd(-1)}
                variant="icon"
              />
            )}
            <SortableList
              stageIds={stageIds}
              onStageAddAfterEnd={onStageAddAfterEnd}
            />
            <AddStage
              index={stageIds.length}
              onAddStage={onStageAddAfterEnd}
              variant="button"
            />
          </div>
        </div>
        <div className={aggregationPanelStyles}>
          <AggregationLibraryPanel />
        </div>
      </DndContext>
    </div>
  );
};

const mapState = (state: RootState) => {
  return {
    stageIds: state.pipelineBuilder.stageEditor.stageIds,
    editViewName: state.editViewName,
    isAggregationLibraryOpen: state.aggregationLibraryPanel.isOpen,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
