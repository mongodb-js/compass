import React from 'react';

import {
  withTheme,
  css,
  cx,
  SpinLoader,
  spacing,
  Body
} from '@mongodb-js/compass-components';

const loadingOverlayStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
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

const textStyles = css({
  marginLeft: spacing[1]
});

type LoadingOverlayProps = {
  darkMode?: boolean;
  text: string;
};

function UnstyledLoadingOverlay({ darkMode, text }: LoadingOverlayProps) {
  return (
    <div
      className={cx(
        loadingOverlayStyles,
        darkMode ? loadingOverlayStylesDark : loadingOverlayStylesLight
      )}
    >
      <SpinLoader />
      <Body className={textStyles}>{text}</Body>
    </div>
  );
}

const LoadingOverlay = withTheme(
  UnstyledLoadingOverlay
) as typeof UnstyledLoadingOverlay;

export { LoadingOverlay };
