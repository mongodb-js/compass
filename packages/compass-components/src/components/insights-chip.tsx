import React from 'react';
import { Chip, Icon } from './leafygreen';
import { css, cx } from '@leafygreen-ui/emotion';
import { fontWeights } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';

const chipLightModeStyles = css({
  '--chipBackgroundColor': palette.blue.light3,
  '--chipBorderColor': palette.blue.light2,
  '--chipColor': palette.blue.dark1,
});

const chipDarkModeStyles = css({
  '--chipBackgroundColor': palette.blue.dark2,
  '--chipBorderColor': palette.blue.dark1,
  '--chipColor': palette.blue.light2,
});

const chipStyles = css({
  fontWeight: fontWeights.bold,
  textTransform: 'uppercase',
  color: 'var(--chipColor)',
  backgroundColor: 'var(--chipBackgroundColor)',
});

export const InsightsChip = () => {
  const isDarkMode = useDarkMode();
  return (
    <Chip
      className={cx(
        isDarkMode
          ? [chipDarkModeStyles, chipStyles]
          : [chipLightModeStyles, chipStyles]
      )}
      label="insight"
      glyph={<Icon glyph="Bulb" />}
    />
  );
};
