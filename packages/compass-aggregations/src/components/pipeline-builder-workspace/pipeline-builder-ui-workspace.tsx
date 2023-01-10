import React from 'react';
import { connect } from 'react-redux';
import Stage from '../stage';
import type { StageProps } from '../stage';
import PipelineBuilderInputDocuments from '../pipeline-builder-input-documents';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import { addStage, moveStage } from '../../modules/pipeline-builder/stage-editor';
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
} from '@dnd-kit/sortable';

import styles from './pipeline-builder-ui-workspace.module.less';

const stageContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  '&.dragging .add-stage-button': {
    visibility: 'hidden',
  }
});

type PipelineBuilderUIWorkspaceProps = {
  stageIds: number[];
  editViewName?: string;
  onStageMoveEnd: (from: number, to: number) => void;
  onAddStage: (after?: number) => void;
};

type SortableItemProps = {
  idx: number;
  isLastStage: boolean;
  onAddStage: (after?: number) => void;
} & Partial<StageProps>;

export const PipelineBuilderUIWorkspace: React.FunctionComponent<PipelineBuilderUIWorkspaceProps> = ({
  stageIds,
  editViewName,
  onStageMoveEnd,
  onAddStage,
}) => {
  const SortableItem = ({ idx, isLastStage, onAddStage, ...props }: SortableItemProps) => {
    return (
      <div className={stageContainerStyles}>
        <Stage index={idx} {...props}></Stage>
        {!isLastStage && <div className='add-stage-button'>
          <AddStage onAddStage={onAddStage} variant='icon' />
        </div>}
      </div>
    );
  };
  
  const SortableList = ({
    children,
  }: { children: React.ReactNode }) => {
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

    const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) => {
      onStageMoveEnd(oldIndex, newIndex);
    };

    return (
      <DndContext
        sensors={sensors}
        autoScroll={false}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over?.id) {
            onSortEnd({ oldIndex: +active.id, newIndex: +over.id });
          }
        }}
      >
        <SortableContext items={stageIds.map((stage, index) => index)}>
          <div>{children}</div>
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <div
      data-testid="pipeline-builder-ui-workspace"
    >
      <div className={styles['pipeline-workspace-container']}>
        <div className={styles['pipeline-workspace']}>
          {editViewName && (
            <ModifySourceBanner editViewName={editViewName} />
          )}
          <PipelineBuilderInputDocuments />
          {stageIds.length !== 0 && <AddStage onAddStage={() => onAddStage(-1)} variant='icon' />}
          <SortableList>
            {stageIds.map((id, index) => {
              return <SortableItem key={`stage-${id}`} idx={index} index={index} isLastStage={index === stageIds.length - 1}
              onAddStage={() => onAddStage(index)} />;
            })}
          </SortableList>
          <AddStage onAddStage={onAddStage} variant='button' />
        </div>
      </div>
    </div>
  );
}

const mapState = (state: RootState) => {
  return {
    stageIds: state.pipelineBuilder.stageEditor.stageIds,
    editViewName: state.editViewName
  }
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onAddStage: addStage,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
