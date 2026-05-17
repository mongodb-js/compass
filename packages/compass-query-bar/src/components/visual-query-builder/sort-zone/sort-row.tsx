import React from 'react';
import {
  Body,
  IconButton,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SortEntry } from '../../../utils/visual-builder-serialize';

const rowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  padding: `${spacing[100]}px 0`,
});

const pathStyles = css({
  fontWeight: 600,
  minWidth: '120px',
});

const handleStyles = css({
  cursor: 'grab',
});

type Props = {
  entry: SortEntry;
  onToggleDirection: () => void;
  onRemove: () => void;
};

export function SortRow({ entry, onToggleDirection, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { kind: 'sort-entry' },
  });

  return (
    <div
      ref={setNodeRef}
      className={rowStyles}
      data-testid={`visual-query-builder-sort-${entry.path}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span className={handleStyles} {...listeners} {...attributes}>
        <Icon glyph="Drag" />
      </span>
      <Body className={pathStyles}>{entry.path}</Body>
      <IconButton
        type="button"
        aria-label={
          entry.direction === 1 ? 'Sort ascending' : 'Sort descending'
        }
        title={entry.direction === 1 ? 'Ascending (1)' : 'Descending (-1)'}
        onClick={onToggleDirection}
        data-testid="visual-query-builder-sort-direction"
      >
        <Icon
          glyph={entry.direction === 1 ? 'SortAscending' : 'SortDescending'}
        />
      </IconButton>
      <IconButton
        type="button"
        aria-label="Remove sort"
        title="Remove sort"
        onClick={onRemove}
      >
        <Icon glyph="X" />
      </IconButton>
    </div>
  );
}
