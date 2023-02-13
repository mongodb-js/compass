import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useMemo } from 'react';
import { useDarkMode } from './use-theme';

const focusRingStyles = css({
  position: 'relative',
  outline: 'none',
  '&::after': {
    position: 'absolute',
    content: '""',
    pointerEvents: 'none',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: spacing[1],
    boxShadow: `0 0 0 0 transparent`,
    transition: 'box-shadow .16s ease-in',
    zIndex: 1,
  },
});

const focusRingVisibleStyles = css({
  '&::after': {
    boxShadow: `0 0 0 3px ${palette.blue.light1} !important`,
    transitionTimingFunction: 'ease-out',
  },
});

const focusRingHoverVisibleStyles = (darkMode: boolean) =>
  css({
    '&::after': {
      boxShadow: `0 0 0 3px ${
        darkMode ? palette.gray.dark2 : palette.gray.light2
      }`,
      transitionTimingFunction: 'ease-out',
    },
  });

/**
 * Default focus ring styles. Can be used for simple cases where we want the
 * default ring with no customization at all (most of the cases in Compass)
 */
export const focusRing = css(focusRingStyles, {
  // It's important that we only show focus ring when the focus is determined by
  // the browser as "visible". This means that e.g., buttons will only get the
  // ring around them when navigating application with a keyboard and not just
  // clicking a button which can be annoying
  //
  // https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
  '&:focus-visible': focusRingVisibleStyles,
});

const focusRingOuter = css({
  '&::after': {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

const focusRingWithin = css({
  '&:focus-within': focusRingVisibleStyles,
});

const focusRingHover = (darkMode: boolean) =>
  css({
    '&:hover': focusRingHoverVisibleStyles(darkMode),
  });

/**
 * Provides focus ring styles with a few additional options allowing to override
 * default style
 *
 * @param options
 * @param options.outer show focus ring outside the component (default: false)
 * @param options.focusWithin show focus ring on focus within instead of focus visible (default: false)
 * @param options.hover show focus ring on hover in addition to focus (default: false)
 * @param options.radius focus ring radius (default: 4px or spacing[1] from leafygreen)
 * @returns props to apply to the component
 */
export function useFocusRing({
  outer = false,
  focusWithin = false,
  hover = false,
  radius,
}: {
  /** show focus ring outside the component (default: false) */
  outer?: boolean;
  /** show focus ring on focus within in addition to focus visible (default: false) */
  focusWithin?: boolean;
  /** show focus ring on hover in addition to focus (default: false) */
  hover?: boolean;
  /** focus ring radius (default: 4px or spacing[1] from leafygreen) */
  radius?: number;
} = {}) {
  const darkMode = useDarkMode();
  const outerClass = useMemo(() => {
    return outer && focusRingOuter;
  }, [outer]);

  const radiusClass = useMemo(() => {
    return (
      typeof radius === 'number' &&
      css({
        '&::after': {
          borderRadius: radius,
        },
      })
    );
  }, [radius]);

  const focusWithinClass = useMemo(() => {
    return focusWithin && focusRingWithin;
  }, [focusWithin]);

  const hoverClass = useMemo(() => {
    return hover && focusRingHover(!!darkMode);
  }, [hover, darkMode]);

  return {
    className: cx(
      focusRing,
      outerClass,
      radiusClass,
      focusWithinClass,
      hoverClass
    ),
  };
}
