import React from 'react';
import {
  Body,
  Icon,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useDraggable } from '@dnd-kit/core';

const itemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: `${spacing[100]}px ${spacing[200]}px`,
  borderRadius: '4px',
  cursor: 'grab',
  userSelect: 'none',
  background: palette.white,
  border: `1px solid ${palette.gray.light2}`,
  '&:hover': {
    background: palette.gray.light3,
  },
});

const itemDarkStyles = css({
  background: palette.gray.dark3,
  borderColor: palette.gray.dark2,
  '&:hover': {
    background: palette.gray.dark2,
  },
});

const draggingStyles = css({
  opacity: 0.5,
  cursor: 'grabbing',
});

const overlayStyles = css({
  cursor: 'grabbing',
  boxShadow: `0 8px 24px ${palette.black}22`,
});

const typeStyles = css({
  color: palette.gray.base,
  marginLeft: 'auto',
  fontSize: '11px',
});

type FieldChipProps = {
  path: string;
  type: string;
  /** Render as a drag overlay ghost (adds a shadow, no hover transitions). */
  forOverlay?: boolean;
};

/**
 * Presentational field card. Shared between the sidebar's draggable item and
 * the {@link DragOverlay} ghost so the two stay visually in sync.
 */
export function FieldChip({ path, type, forOverlay = false }: FieldChipProps) {
  const darkMode = useDarkMode();
  return (
    <div
      className={cx(
        itemStyles,
        darkMode && itemDarkStyles,
        forOverlay && overlayStyles
      )}
    >
      <Icon glyph="Drag" size="small" />
      <Body>{path}</Body>
      <Body className={typeStyles}>{type}</Body>
    </div>
  );
}

type Props = {
  path: string;
  type: string;
  onDoubleClick?: () => void;
};

export function DraggableField({ path, type, onDoubleClick }: Props) {
  const darkMode = useDarkMode();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-${path}`,
    data: { kind: 'field', path, type },
  });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        itemStyles,
        darkMode && itemDarkStyles,
        isDragging && draggingStyles
      )}
      data-testid={`draggable-field-${path}`}
      onDoubleClick={onDoubleClick}
      {...listeners}
      {...attributes}
    >
      <Icon glyph="Drag" size="small" />
      <Body>{path}</Body>
      <Body className={typeStyles}>{type}</Body>
    </div>
  );
}
