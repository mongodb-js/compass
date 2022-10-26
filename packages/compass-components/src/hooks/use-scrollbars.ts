import { rgba } from 'polished';
import { palette } from '@leafygreen-ui/palette';
import { css } from '@leafygreen-ui/emotion';
import { useMemo } from 'react';

import { Theme, useTheme } from '../hooks/use-theme';

const scrollbarSize = 10;

const scrollbarStyles = css({
  '*::-webkit-scrollbar-thumb': {
    // Don't show a scrollbar unless the user is hovering over
    // the scrollable area. (horizontal scrollbars are different).
    backgroundColor: 'transparent',
    borderRadius: `${scrollbarSize}px`,
  },
  '*::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },

  '*::-webkit-scrollbar': {
    width: `${scrollbarSize}px`,
    '&:horizontal': {
      height: `${scrollbarSize}px`,
    },
  },
});

const scrollbarLightModeStyles = css(
  {
    '*:active::-webkit-scrollbar-thumb, *:focus::-webkit-scrollbar-thumb, *:hover::-webkit-scrollbar-thumb':
      {
        backgroundColor: rgba(palette.black, 0.12),
        '&:hover': {
          backgroundColor: rgba(palette.black, 0.2),
        },
      },
    '*::-webkit-scrollbar-thumb': {
      '&:horizontal': {
        // Always show horizontal scrollbars so that folks without
        // trackpads or horizontal scrollable devices can easily scroll.
        backgroundColor: rgba(palette.black, 0.12),
      },
    },
    '*::-webkit-scrollbar-track': {
      '&:hover': {
        backgroundColor: rgba(palette.black, 0.04),
      },
    },
  },
  scrollbarStyles
);

// TODO(COMPASS-6206): Don't export this, as the shell should be the only consumer.
export const scrollbarDarkModeStyles = css(
  {
    '*:active::-webkit-scrollbar-thumb, *:focus::-webkit-scrollbar-thumb, *:hover::-webkit-scrollbar-thumb':
      {
        backgroundColor: rgba(palette.white, 0.2),
        '&:hover': {
          backgroundColor: rgba(palette.white, 0.25),
        },
      },
    '*::-webkit-scrollbar-thumb': {
      '&:horizontal': {
        // Always show horizontal scrollbars so that folks without
        // trackpads or horizontal scrollable devices can easily scroll.
        backgroundColor: rgba(palette.white, 0.2),
      },
    },
    '*::-webkit-scrollbar-track': {
      '&:hover': {
        backgroundColor: rgba(palette.white, 0.1),
      },
    },
  },
  scrollbarStyles
);

/**
 * This function provides styles for overflowing content scrollbars.
 * If you're inside of an area that will be on a different
 * background color than the rest of Compass, this is useful to have.
 * It takes the theme from the theme context (closest ThemeProvider).
 *
 * We customize scrollbars so that they look similar on all devices.
 * Without custom scrollbars, windows looks a bit wild.
 *
 * @returns props to apply to the component
 **/
export function useScrollbars() {
  const theme = useTheme();

  const scrollbarStylesClass = useMemo(() => {
    return theme?.theme === Theme.Dark
      ? scrollbarDarkModeStyles
      : scrollbarLightModeStyles;
  }, [theme]);

  return {
    className: scrollbarStylesClass,
  };
}
