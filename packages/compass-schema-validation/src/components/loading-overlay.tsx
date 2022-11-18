import React from 'react';

import {
  withTheme,
  css,
  cx,
  SpinLoader,
  spacing,
} from '@mongodb-js/compass-components';

const loadingOverlayStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  borderRadius: spacing[2],
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const loadingOverlayStylesDark = css({
  backgroundColor: 'black',
});

const loadingOverlayStylesLight = css({
  backgroundColor: 'white',
});

type LoadingOverlayProps = {
  darkMode?: boolean;
};

function UnstyledLoadingOverlay({ darkMode }: LoadingOverlayProps) {
  return (
    <div
      className={cx(
        loadingOverlayStyles,
        darkMode ? loadingOverlayStylesDark : loadingOverlayStylesLight
      )}
    >
      <SpinLoader />
    </div>
  );
}

const LoadingOverlay = withTheme(
  UnstyledLoadingOverlay
) as typeof UnstyledLoadingOverlay;
export { LoadingOverlay };
