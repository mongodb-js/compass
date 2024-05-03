import { useState, useEffect, useRef } from 'react';
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

// When the id changes this hook will return styles that show
// a fading-out blue background effect on the element.
// When the fading out completes the clear effect function is
// called so that re-mounts can avoid showing the same effect.
// The returned key updates as a way to refresh the effect.
export const useInputLoadedVisualEffect = ({
  id,
  onClearEffect,
  timeout = ANIMATION_TIMEOUT_MS, // Exposed for testing.
}: {
  id: number | null;
  onClearEffect: () => void;
  timeout?: number;
}) => {
  const [hasBeenApplied, setHasBeenApplied] = useState(false);
  const darkMode = useDarkMode();
  const hideEffectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (id !== null) {
      // When it's set to false we don't want the effect to immediately stop as the
      // it fades away. This may happen from asynchronous formatting.
      setHasBeenApplied(true);

      if (hideEffectTimeout.current !== null) {
        clearTimeout(hideEffectTimeout.current);
        hideEffectTimeout.current = null;
      }

      hideEffectTimeout.current = setTimeout(() => {
        // When the effect has completed we want to clear any store of it. This is so that
        // when a component using this is re-mounted it does not show the visual effect
        // This does force a re-render of the component as the key changes.
        setHasBeenApplied(false);
        onClearEffect();
        hideEffectTimeout.current = null;
      }, timeout ?? ANIMATION_TIMEOUT_MS);
    }

    return () => {
      if (hideEffectTimeout.current) {
        clearTimeout(hideEffectTimeout.current);
        hideEffectTimeout.current = null;
      }
    };
  }, [id, onClearEffect, timeout]);

  return {
    className: hasBeenApplied
      ? cx(
          externalAppliedQueryStyles,
          darkMode
            ? externalAppliedQueryDarkModeStyles
            : externalAppliedQueryLightModeStyles
        )
      : undefined,
    key: !hasBeenApplied || id === null ? 'no-effect' : `${id}`,
  };
};
