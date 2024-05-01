import { useState, useEffect } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { useDarkMode } from './use-theme';

const ANIMATION_TIMEOUT_MS = 3500;

const externalAppliedQueryStyles = css({
  borderRadius: spacing[150],
});

const fadeOutAnimationDarkMode = keyframes({
  from: {
    background: 'rgba(223, 245, 253, 0.4)',
  },
  to: {
    opacity: 'rgba(225, 247, 255, 0)',
  },
});

const externalAppliedQueryDarkModeStyles = css({
  backgroundColor: 'rgba(225, 247, 255, 0)',
  animation: `${fadeOutAnimationDarkMode} ${ANIMATION_TIMEOUT_MS}ms ease-out`,
});

const fadeOutAnimationLightMode = keyframes({
  from: {
    background: 'rgba(223, 245, 253, 1)',
  },
  to: {
    opacity: 'rgba(225, 247, 255, 0)',
  },
});

const externalAppliedQueryLightModeStyles = css({
  backgroundColor: 'rgba(225, 247, 255, 0)',
  animation: `${fadeOutAnimationLightMode} ${ANIMATION_TIMEOUT_MS}ms ease-out`,
});

// When the id changes and isApplied is true or has been set to true
// recently, this hook will return styles that show a
// fading-out blue background effect on the element.
// The returned key updates as a way to refresh the effect.
export const useVisuallyAppliedEffect = (key: string, isApplied: boolean) => {
  const [hasBeenApplied, setHasBeenApplied] = useState(false);
  const darkMode = useDarkMode();

  useEffect(() => {
    if (isApplied) {
      // When it's set to false we don't want the effect to immediately stop as the
      // it fades away. This may happen from asynchronous formatting.
      setHasBeenApplied(true);
    }
  }, [isApplied]);

  return {
    className: hasBeenApplied
      ? cx(
          externalAppliedQueryStyles,
          darkMode
            ? externalAppliedQueryDarkModeStyles
            : externalAppliedQueryLightModeStyles
        )
      : undefined,
    key: hasBeenApplied ? key : undefined,
  };
};
