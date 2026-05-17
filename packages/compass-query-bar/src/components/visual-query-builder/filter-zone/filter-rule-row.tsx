import React, { useCallback, useRef, useState } from 'react';
import {
  Body,
  IconButton,
  Icon,
  css,
  cx,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import { OperatorDropdown } from './operator-dropdown';
import { ValueEditor } from './value-editor';
import {
  parseValueDragPayload,
  VALUE_DRAG_MIME_TYPE,
  type FilterRule,
  type ValueDragPayload,
} from '../../../utils/visual-builder-serialize';
import type { VisualBuilderOperator } from '../../../constants/visual-builder-operators';

const rowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: `${spacing[100]}px 0`,
});

const pathStyles = css({
  fontWeight: 600,
  minWidth: '120px',
});

const valueSlotStyles = css({
  flex: 1,
  display: 'flex',
  borderRadius: '4px',
  // A 1px transparent border that becomes visible on dragover. Keeps the row
  // height stable so the layout doesn't reflow under the cursor.
  border: '1px dashed transparent',
});

const valueSlotOverStyles = css({
  borderColor: palette.green.dark2,
  background: palette.green.light3,
});

type Props = {
  rule: FilterRule;
  onOperatorChange: (op: VisualBuilderOperator) => void;
  onValueChange: (valueString: string) => void;
  onValueDrop?: (payload: ValueDragPayload) => void;
  onRemove: () => void;
};

export function FilterRuleRow({
  rule,
  onOperatorChange,
  onValueChange,
  onValueDrop,
  onRemove,
}: Props) {
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
      // Stop the parent zone's handler from also reacting — a per-rule drop
      // updates an existing rule's value rather than creating a new one.
      e.stopPropagation();
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
      e.stopPropagation();
      onValueDrop(payload);
    },
    [onValueDrop]
  );

  return (
    <div
      className={rowStyles}
      data-testid={`visual-query-builder-rule-${rule.path}`}
    >
      <Body className={pathStyles}>{rule.path}</Body>
      <OperatorDropdown
        bsonType={rule.bsonType}
        value={rule.operator}
        onChange={onOperatorChange}
      />
      <div
        className={cx(valueSlotStyles, isValueOver && valueSlotOverStyles)}
        data-testid={`visual-query-builder-rule-value-slot-${rule.path}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ValueEditor
          bsonType={rule.bsonType}
          operator={rule.operator}
          valueString={rule.valueString}
          onChange={onValueChange}
        />
      </div>
      <IconButton
        type="button"
        aria-label="Remove rule"
        title="Remove rule"
        onClick={onRemove}
        data-testid="visual-query-builder-rule-remove"
      >
        <Icon glyph="X" />
      </IconButton>
    </div>
  );
}
