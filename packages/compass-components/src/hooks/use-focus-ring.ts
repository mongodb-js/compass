import type React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { FocusState, useFocusState } from './use-focus-hover';

export const focusRingStyles = css({
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
    boxShadow: `0 0 0 0 ${uiColors.focus}`,
    transition: 'box-shadow .16s ease-in',
  },
});

export const focusRingVisibleStyles = css({
  '&::after': {
    boxShadow: `0 0 0 3px ${uiColors.focus}`,
    transitionTimingFunction: 'ease-out',
  },
});

export function useFocusRing<T extends HTMLElement>(): React.HTMLProps<T> {
  const [focusProps, focusState] = useFocusState();

  return {
    ...focusProps,
    className: cx(
      focusRingStyles,
      focusState === FocusState.FocusVisible && focusRingVisibleStyles
    ),
  };
}
