import React, { useRef, useEffect } from 'react';
import type { StageIdAndType } from '../../../modules/pipeline-builder/stage-editor';
import { css } from '@mongodb-js/compass-components';
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
import UseCaseDroppableArea from '../../use-case-droppable-area';

const sortableItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

export type SortableProps = {
  style: React.CSSProperties;
  setNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
};

type SortableItemProps = {
  id: number;
  index: number;
  type: StageIdAndType['type'];
};

const SortableItem = ({ id, index, type }: SortableItemProps) => {
  const { setNodeRef, transform, transition, listeners, isDragging } =
    useSortable({
      id: id + 1,
    });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // When the list is initially rendered, it ideally should scroll to the last
  // stage/wizard. There is a bug in Chromium preventing this from happening
  // (with smooth behavior). One potential workaround is to change the behavior
  // to 'auto' or remove it altogether, which resolves the issue but sacrifices
  // the smooth animation. Despite this, we have decided to keep the current
  // configuration as the previous behavior remains unchanged.
  // https://stackoverflow.com/a/63563437
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 1 } : {}),
  };

  const sortableProps: SortableProps = {
    setNodeRef,
    style,
    listeners,
  };

  return (
    <div ref={containerRef} className={sortableItemStyles}>
      {type === 'stage' ? (
        <Stage index={index} {...sortableProps} />
      ) : (
        <Wizard index={index} {...sortableProps} />
      )}
    </div>
  );
};

type SortableListProps = {
  stagesIdAndType: StageIdAndType[];
  onStageAddAfterEnd: (after?: number) => void;
};

export const SortableList = ({
  stagesIdAndType,
  onStageAddAfterEnd,
}: SortableListProps) => {
  // It requires that you pass it a sorted array of the unique identifiers
  // associated with the elements that use the useSortable hook within it.
  // They must be strings or numbers bigger than 0.
  // It's important that the items prop passed to SortableContext
  // be sorted in the same order in which the items are rendered.
  const items = stagesIdAndType.map(({ id }) => id + 1);

  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {stagesIdAndType.map(({ id, type }, index) => (
        <React.Fragment key={`stage-${id}`}>
          {/* addAfterIndex is index-1 because UseCaseDroppableArea is rendered above the sortable item */}
          <UseCaseDroppableArea index={index - 1}>
            <AddStage
              variant="icon"
              onAddStage={() => onStageAddAfterEnd(index - 1)}
            />
          </UseCaseDroppableArea>
          <SortableItem id={id} index={index} type={type} />
        </React.Fragment>
      ))}
    </SortableContext>
  );
};
