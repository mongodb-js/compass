import React, { useState, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import Stage from '../stage';
import PipelineBuilderInputDocuments from '../pipeline-builder-input-documents';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import { moveStage } from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';
import { SortableOverlay } from "./pipeline-builder-ui-workspace-overlay";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { SortableContext, useSortable, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import type { Active } from "@dnd-kit/core";

import styles from './pipeline-builder-ui-workspace.module.less';

type PipelineBuilderUIWorkspaceProps = {
  stageIds: number[];
  editViewName?: string;
};

interface SortableListProps {
  items: { id: number }[];
  children: any;
  onChange: any;
}

export const PipelineBuilderUIWorkspace: React.FunctionComponent<PipelineBuilderUIWorkspaceProps> = ({
  stageIds,
  editViewName,
}) => {
  console.log('stageIds----------------------');
  console.log(stageIds);
  console.log('----------------------');

  const [items, setItems] = useState(stageIds.map((stageId, index) => ({ id: index + 1 })));

  useEffect(() => {
    setItems([...items, { id: stageIds.length + 1 }]);
  }, [stageIds]);

  console.log('items----------------------');
  console.log(items);
  console.log('----------------------');

  const SortableStage = (props: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: props.index });
  
    const style = {
      transform: cssDndKit.Transform.toString(transform),
      transition,
    };
  
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Stage id={props.index} {...props}></Stage>
      </div>
    );
  };
  
  const SortableList = ({
    children,
    onChange,
  }: SortableListProps) => {
    const [active, setActive] = useState<Active | null>(null);
    const activeItem = useMemo(
      () => items.find((item) => item.id === active?.id),
      [active, items]
    );
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );

    return (
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => {
          setActive(active);
        }}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over?.id) {
            const activeIndex = items.findIndex(({ id }) => id === active.id);
            const overIndex = items.findIndex(({ id }) => id === over.id);

            onChange(arrayMove(items, activeIndex, overIndex));
          }
          setActive(null);
        }}
        onDragCancel={() => {
          setActive(null);
        }}
      >
        <SortableContext items={items}>
          <div>{children}</div>
        </SortableContext>
        <SortableOverlay>
          {activeItem ? children[activeItem.id] : null}
        </SortableOverlay>
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
          <SortableList items={items} onChange={setItems}>
            {stageIds.map((id, index) => {
              return <SortableStage key={id} index={index} />;
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
