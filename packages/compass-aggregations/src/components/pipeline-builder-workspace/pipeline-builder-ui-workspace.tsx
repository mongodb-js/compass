import React from 'react';
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
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
 } from '@dnd-kit/core';
import {
  SortableContext,
} from '@dnd-kit/sortable';

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
    return (<Stage index={idx} {...props}></Stage>);
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
          <SortableList>
            {stageIds.map((id, index) => {
              return <SortableItem key={`stage-${id}`} idx={index} index={index} />;
            })}
          </SortableList>
          <AddStage />
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
  onStageMoveEnd: moveStage
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
