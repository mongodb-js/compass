import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { css, palette, spacing } from '@mongodb-js/compass-components';

// Types
type UseCaseDroppableAreaProps = {
  index: number;
  children?: React.ReactNode;
};

// Helpers
export const isValidDroppableId = (id: string) => id.startsWith('droppable-');
export const droppableIdFromIndex = (index: number) => `droppable-${index}`;
export const indexFromDroppableId = (id: string) => {
  if (isValidDroppableId(id)) {
    return +id.replace(/^droppable-/, '');
  } else {
    return null;
  }
};

// Component
const droppableContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: spacing[5],
  position: 'relative',
});

const dropMarkerStyles = css({
  position: 'absolute',
  width: '100%',
  top: '50%',
  height: spacing[1] / 4,
  background: palette.green.dark1,
  borderRadius: spacing[2],
});

const UseCaseDroppableArea = ({
  index,
  children,
}: UseCaseDroppableAreaProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableIdFromIndex(index),
  });

  return (
    <div ref={setNodeRef} className={droppableContainerStyles}>
      {isOver ? (
        <div
          data-testid={`use-case-drop-marker-${index}`}
          className={dropMarkerStyles}
        />
      ) : (
        children
      )}
    </div>
  );
};

export default UseCaseDroppableArea;
