import React, { useState } from 'react';
import {
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
  InteractivePopover,
  Icon,
  Button,
} from '@mongodb-js/compass-components';
import type { QueryOptionOfTypeDocument } from '../constants/query-option-definition';
import type { UnsafeIntegerViolation } from './option-editor';

const emptySpaceStyles = css({
  // Width of a warning icon
  width: spacing[400],
});

const warningIconButtonStyles = css({
  background: 'none',
  border: 'none',
  padding: 0,
  outline: 'none',
  cursor: 'pointer',
  display: 'flex',
  color: palette.red.light1,
});

const warningIconButtonDarkStyles = css({
  color: palette.red.base,
});

const popoverContentStyles = css({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[400],
  padding: `${spacing[300]}px ${spacing[400]}px`,
  maxWidth: spacing[1600] * 6,
  fontSize: '13px',
  lineHeight: '20px',
  '& > button': {
    flexShrink: 0,
  },
});

export function EditorWarning({
  optionName,
  violations,
  onFixViolations,
}: {
  optionName: QueryOptionOfTypeDocument;
  violations: UnsafeIntegerViolation[];
  onFixViolations: () => void;
}) {
  const darkMode = useDarkMode();
  const [open, setOpen] = useState(false);

  if (optionName !== 'filter') {
    return null;
  }

  if (violations.length === 0) {
    return <div className={emptySpaceStyles} />;
  }

  return (
    <InteractivePopover<HTMLButtonElement>
      open={open}
      setOpen={setOpen}
      align="bottom"
      justify="start"
      hideCloseButton
      containerClassName={popoverContentStyles}
      trigger={({ onClick, ref, children }) => (
        <>
          <button
            type="button"
            ref={ref}
            onClick={onClick}
            className={cx(
              warningIconButtonStyles,
              darkMode && warningIconButtonDarkStyles
            )}
          >
            <Icon glyph="Warning" />
          </button>
          {children}
        </>
      )}
    >
      Exceeds safe integer range. Convert to Int64 to match.
      <Button
        size="xsmall"
        onClick={() => {
          setOpen(false);
          onFixViolations();
        }}
      >
        Convert to Int64
      </Button>
    </InteractivePopover>
  );
}
