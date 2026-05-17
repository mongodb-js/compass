import React, { useCallback, useRef, useState } from 'react';
import {
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useDroppable } from '@dnd-kit/core';
import {
  VALUE_DRAG_MIME_TYPE,
  parseValueDragPayload,
  type ValueDragPayload,
} from '../../utils/visual-builder-serialize';

const zoneStyles = css({
  border: `1px dashed ${palette.gray.light1}`,
  borderRadius: '4px',
  padding: spacing[200],
  minHeight: spacing[800],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const zoneDarkStyles = css({
  borderColor: palette.gray.dark1,
});

const zoneOverStyles = css({
  borderColor: palette.green.base,
  background: palette.green.light3,
});

const zoneOverDarkStyles = css({
  background: palette.green.dark3,
});

const emptyStyles = css({
  color: palette.gray.base,
  fontStyle: 'italic',
  textAlign: 'center',
  padding: spacing[200],
});

type Props = {
  id: string;
  isEmpty: boolean;
  emptyMessage?: string;
  /**
   * Called when a cross-plugin value drag (MIME type
   * `application/x-mongodb-value`) is dropped on this zone. Distinct from the
   * dnd-kit drop, which dispatches via the panel's `onDragEnd`.
   */
  onValueDrop?: (payload: ValueDragPayload) => void;
  children?: React.ReactNode;
  'data-testid'?: string;
};

export function DropZone({
  id,
  isEmpty,
  emptyMessage = 'Drag field here or double-click',
  onValueDrop,
  children,
  ...rest
}: Props) {
  const darkMode = useDarkMode();
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { kind: 'zone', zone: id.replace(/^zone-/, '') },
  });

  // Counter-based tracking so isValueOver stays true while the pointer crosses
  // child element boundaries inside the zone (dragenter/leave fire per child).
  const dragDepth = useRef(0);
  const [isValueOver, setIsValueOver] = useState(false);

  const hasValueMime = (e: React.DragEvent) =>
    !!onValueDrop &&
    Array.from(e.dataTransfer.types).includes(VALUE_DRAG_MIME_TYPE);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!hasValueMime(e)) return;
      dragDepth.current += 1;
      setIsValueOver(true);
    },
    // hasValueMime closes over onValueDrop, but it's a stable reference path —
    // recreating on every render is fine for an event handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onValueDrop]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!hasValueMime(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsValueOver(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onValueDrop]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!hasValueMime(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onValueDrop]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!onValueDrop) return;
      const payload = parseValueDragPayload(e.dataTransfer);
      dragDepth.current = 0;
      setIsValueOver(false);
      if (!payload) return;
      e.preventDefault();
      onValueDrop(payload);
    },
    [onValueDrop]
  );

  const isAnyOver = isOver || isValueOver;

  return (
    <div
      ref={setNodeRef}
      data-testid={rest['data-testid'] ?? `drop-zone-${id}`}
      className={cx(
        zoneStyles,
        darkMode && zoneDarkStyles,
        isAnyOver && zoneOverStyles,
        isAnyOver && darkMode && zoneOverDarkStyles
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isEmpty ? <div className={emptyStyles}>{emptyMessage}</div> : children}
    </div>
  );
}
