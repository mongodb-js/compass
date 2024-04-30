import { useState, useEffect, useRef } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, keyframes } from '@leafygreen-ui/emotion';
import { UUID } from 'bson';

const fadeOutAnimation = keyframes({
  from: {
    background: 'rgba(223, 245, 253, 0.5)',
  },
  to: {
    opacity: 'rgba(225, 247, 255, 0)',
  },
});

const ANIMATION_TIMEOUT_MS = 3000;

const externalAppliedQueryStyles = css({
  backgroundColor: 'rgba(225, 247, 255, 0)',
  borderRadius: spacing[150],
  animation: `${fadeOutAnimation} ${ANIMATION_TIMEOUT_MS}ms ease-out`,
});

// When the id changes and isApplied is true or has been set to true
// recently, this hook will return styles that show a
// fading-out blue background effect on the element.
// The returned key updates as a way to refresh the effect.
export const useVisuallyAppliedEffect = (key: string, isApplied: boolean) => {
  const [hasBeenApplied, setHasBeenApplied] = useState(false);
  const hasStylesApplied = useRef<boolean>(isApplied);
  const [forceRefreshKey, setForceRefreshKey] = useState(key);

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
    className: hasBeenApplied ? externalAppliedQueryStyles : undefined,
    key: hasBeenApplied ? forceRefreshKey : undefined,
  };
};
