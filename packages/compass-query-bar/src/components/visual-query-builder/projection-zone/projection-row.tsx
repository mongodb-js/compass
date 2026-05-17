import React from 'react';
import {
  Body,
  IconButton,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { ProjectionEntry } from '../../../utils/visual-builder-serialize';

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

type Props = {
  entry: ProjectionEntry;
  onToggleMode: () => void;
  onRemove: () => void;
};

export function ProjectionRow({ entry, onToggleMode, onRemove }: Props) {
  return (
    <div
      className={rowStyles}
      data-testid={`visual-query-builder-projection-${entry.path}`}
    >
      <Body className={pathStyles}>{entry.path}</Body>
      <SegmentedControl
        size="xsmall"
        value={entry.mode === 1 ? 'include' : 'exclude'}
        onChange={onToggleMode}
        aria-label="Include or exclude"
      >
        <SegmentedControlOption value="include">
          Include (1)
        </SegmentedControlOption>
        <SegmentedControlOption value="exclude">
          Exclude (0)
        </SegmentedControlOption>
      </SegmentedControl>
      <IconButton
        type="button"
        aria-label="Remove projection"
        title="Remove projection"
        onClick={onRemove}
      >
        <Icon glyph="X" />
      </IconButton>
    </div>
  );
}
