import React from 'react';

import {
  css,
  cx,
  SpinLoader,
  spacing,
  palette,
  useDarkMode,
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
  backgroundColor: palette.black,
});

const loadingOverlayStylesLight = css({
  backgroundColor: palette.white,
});

function LoadingOverlay() {
  const darkMode = useDarkMode();

  return (
    <div
      data-testid="load-sample-spinner"
      className={cx(
        loadingOverlayStyles,
        darkMode ? loadingOverlayStylesDark : loadingOverlayStylesLight
      )}
    >
      <SpinLoader />
    </div>
  );
}

export { LoadingOverlay };
