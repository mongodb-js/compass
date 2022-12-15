import { rgba } from 'polished';
import { palette } from '@leafygreen-ui/palette';
import { css, cx } from '@leafygreen-ui/emotion';
import React, { useMemo } from 'react';
import isElectronRenderer from 'is-electron-renderer';

import { useDarkMode } from './use-theme';

const scrollbarSize = 10;

const scrollbarStyles = css({
  '*::-webkit-scrollbar-thumb': {
    // Don't show a scrollbar unless the user is hovering over
    // the scrollable area. Horizontal scrollbars are always shown.
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
  '*::-webkit-scrollbar-corner': {
    background: 'transparent',
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

const scrollbarDarkModeStyles = css(
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

export function getScrollbarStyles(darkMode: boolean) {
  return darkMode ? scrollbarDarkModeStyles : scrollbarLightModeStyles;
}

/**
 * Provide styles for overflowing content scrollbars.
 * It takes the theme from the theme context (closest LeafyGreenProvider).
 *
 * We customize scrollbars so that they look similar on all devices.
 * Without custom scrollbars, windows looks a bit wild.
 **/
export function useScrollbars() {
  const darkMode = useDarkMode();

  const scrollbarStylesClass = useMemo(() => {
    if (!isElectronRenderer) {
      // When we're not in an electron environment, like compass-aggregations
      // in cloud, we don't apply the scrollbar styles.
      return undefined;
    }

    return getScrollbarStyles(!!darkMode);
  }, [darkMode]);

  return {
    className: scrollbarStylesClass,
  };
}

interface WithPortalClassName {
  portalClassName?: string;
}

// Used to wrap LeafyGreen components that use portals with Compass'
// scrollbar styles. These are not applied in web environments (cloud).
export const withPortalScrollbars = <
  ComponentProps extends WithPortalClassName
>(
  WrappedComponent: React.ComponentType<ComponentProps & WithPortalClassName>
) => {
  const ComponentWithScrollbars = (props: ComponentProps) => {
    const { className } = useScrollbars();

    // When we're not in an electron environment, like compass-aggregations
    // in cloud, we don't apply the scrollbar styles.
    const appliedClassName = isElectronRenderer ? className : undefined;

    return (
      <WrappedComponent
        {...props}
        portalClassName={cx(appliedClassName, props.portalClassName)}
      />
    );
  };

  return ComponentWithScrollbars;
};
