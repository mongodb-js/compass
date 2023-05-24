import React from 'react';

import {
  css,
  cx,
  Loader,
  spacing,
  Body,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';

const loadingOverlayStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const loadingOverlayStylesDark = css({
  backgroundColor: palette.black,
});

const loadingOverlayStylesLight = css({
  backgroundColor: 'white',
});

const textStyles = css({
  marginLeft: spacing[2],
});

type LoadingOverlayProps = {
  text: string;
};

function LoadingOverlay({ text }: LoadingOverlayProps) {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        loadingOverlayStyles,
        darkMode ? loadingOverlayStylesDark : loadingOverlayStylesLight
      )}
    >
      <Loader />
      <Body className={textStyles}>{text}</Body>
    </div>
  );
}

export { LoadingOverlay };
