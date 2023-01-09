import React, { useState } from 'react';
import { connect } from 'react-redux';
import Stage from '../stage';
import type { StageProps } from '../stage';
import PipelineBuilderInputDocuments from '../pipeline-builder-input-documents';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import { moveStage } from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  MouseSensor,
  useSensor,
  useSensors,
  TouchSensor,
 } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import type { Active } from '@dnd-kit/core';

import styles from './pipeline-builder-ui-workspace.module.less';

type PipelineBuilderUIWorkspaceProps = {
  stageIds: number[];
  editViewName?: string;
  onStageMoveEnd: (from: number, to: number) => void;
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<PipelineBuilderUIWorkspaceProps> = ({
  stageIds,
  editViewName,
  onStageMoveEnd,
}) => {
  const SortableItem = ({ idx, ...props }: { idx: number } & Partial<StageProps>) => {
    console.log('props----------------------');
    console.log(props);
    console.log('----------------------');

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: idx });
  
    const style = {
      transform: cssDndKit.Transform.toString(transform),
      transition,
    };
  
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Stage index={idx} {...props}></Stage>
      </div>
    );
  };
  
  const SortableList = ({
    children,
  }: { children: React.ReactNode }) => {
    const [active, setActive] = useState<Active | null>(null);
    const sensors = useSensors(
      useSensor(MouseSensor, {
        // Require the mouse to move by 10 pixels before activating
        activationConstraint: {
          distance: 10,
        },
      }),
      useSensor(TouchSensor, {
        // Press delay of 250ms, with tolerance of 5px of movement
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
        collisionDetection={closestCorners}
        onDragStart={({active}) => {
          setActive(active);
        }}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over?.id) {
            onSortEnd({ oldIndex: +active.id, newIndex: +over.id });
          }
          setActive(null);
        }}
        onDragCancel={() => {
          setActive(null);
        }}
      >
        <SortableContext items={stageIds}>
          <div>{children}</div>
        </SortableContext>
        <DragOverlay>{active ? <SortableItem idx={+active.id} index={+active.id} /> : null}</DragOverlay>
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
          <SortableList>
            {stageIds.map((id, index) => {
              return <SortableItem key={id} idx={index} index={index} />;
            })}
          </SortableList>
          <AddStage />
        </div>
      </div>
    </div>
  );
}

/**
 *
 * @param {import('./../../modules/').RootState} state
 */
const mapState = (state: RootState) => {
  return {
    stageIds: state.pipelineBuilder.stageEditor.stageIds,
    editViewName: state.editViewName
  }
};

const mapDispatch = {
  onStageMoveEnd: moveStage
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
