import React from 'react';
import {
  Body,
  Button,
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

const overlayStyles = css({
  position: 'absolute',
  inset: 0,
  background: 'rgba(255, 255, 255, 0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[200],
  zIndex: 1,
  padding: spacing[400],
  textAlign: 'center',
});

const overlayDarkStyles = css({
  background: 'rgba(0, 0, 0, 0.75)',
});

const headlineStyles = css({
  fontWeight: 600,
  color: palette.gray.dark2,
});

const headlineDarkStyles = css({
  color: palette.gray.light2,
});

type Props = {
  onClear: () => void;
};

export function UnrepresentableOverlay({ onClear }: Props) {
  const darkMode = useDarkMode();
  return (
    <div
      data-testid="visual-query-builder-unrepresentable"
      className={`${overlayStyles} ${darkMode ? overlayDarkStyles : ''}`}
    >
      <Body
        className={`${headlineStyles} ${darkMode ? headlineDarkStyles : ''}`}
      >
        This query has shapes the visual builder can&apos;t represent yet.
      </Body>
      <Body>Clear filter, projection and sort to keep building visually.</Body>
      <Button variant="primary" size="small" onClick={onClear}>
        Clear &amp; continue
      </Button>
    </div>
  );
}
