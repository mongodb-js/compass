import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { css } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';

export const DroppableMarker = ({
  dropIndex,
  children,
}: {
  dropIndex: number;
  children?: React.ReactElement;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: `droppable-${dropIndex}` });
  console.log(dropIndex, isOver);
  const markerStyles = css({
    width: '100%',
    height: '2px',
    position: 'relative',
    '::after': {
      content: '" "',
      position: 'absolute',
      left: 0,
      right: 0,
      top: '3%',
      height: '2px',
      borderRadius: '4px',
      background: isOver ? palette.green.dark2 : palette.white,
    },
  });

  return (
    <div
      data-testid={`droppable-${dropIndex}`}
      ref={setNodeRef}
      className={markerStyles}
    >
      {/* {children} */}
    </div>
  );
};
