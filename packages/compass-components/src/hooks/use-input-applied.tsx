import { useState, useEffect, useRef } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { UUID } from 'bson';
import { useDarkMode } from './use-theme';

const ANIMATION_TIMEOUT_MS = 4000;

const externalAppliedQueryStyles = css({
  borderRadius: spacing[150],
});

const fadeOutAnimationDarkMode = keyframes({
  from: {
    background: 'rgba(223, 245, 253, 0.5)',
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
  const hasStylesApplied = useRef<boolean>(isApplied);
  const [forceRefreshKey, setForceRefreshKey] = useState(key);
  const darkMode = useDarkMode();

  useEffect(() => {
    if (isApplied) {
      setHasBeenApplied(true);

      // When it's applied and there's already an effect,
      // we update the returned key to refresh it.
      if (hasStylesApplied.current) {
        setForceRefreshKey(key + new UUID().toString());
      }

      hasStylesApplied.current = true;
    }
  }, [isApplied, key]);

  return {
    className: hasBeenApplied
      ? cx(
          externalAppliedQueryStyles,
          darkMode
            ? externalAppliedQueryDarkModeStyles
            : externalAppliedQueryLightModeStyles
        )
      : undefined,
    key: hasBeenApplied ? forceRefreshKey : undefined,
  };
};
