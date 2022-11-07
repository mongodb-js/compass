import React from 'react';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';

interface SpinLoaderProps {
  size?: string;
  title?: string;
  darkMode?: boolean;
}

const shellLoaderSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinLoaderStyle = css`
  border: 2px solid transparent;
  border-top: 2px solid;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: inline-block;

  animation: ${shellLoaderSpin} 700ms ease infinite;
`;

const loaderColorDark = css({
  borderTopColor: palette.green.light2,
});

const loaderColorLight = css({
  borderTopColor: palette.gray.dark3,
});

function SpinLoader({
  size = '12px',
  title,
  darkMode: _darkMode,
}: SpinLoaderProps): JSX.Element {
  const darkMode = useDarkMode(_darkMode);
  return (
    <div
      className={cx(
        spinLoaderStyle,
        darkMode ? loaderColorDark : loaderColorLight
      )}
      style={{
        width: size,
        height: size,
      }}
      title={title}
    />
  );
}

export { SpinLoader };
