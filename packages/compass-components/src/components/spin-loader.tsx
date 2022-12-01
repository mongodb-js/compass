import React from 'react';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { withTheme } from '../hooks/use-theme';

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
  border-radius: 50%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: inline-block;

  animation: ${shellLoaderSpin} 700ms ease infinite;
`;
const lightStyles = css({
  borderTop: `2px solid ${palette.gray.dark3}`,
});

const darkStyles = css({
  borderTop: `2px solid ${palette.gray.light3}`,
});

function UnstyledSpinLoader({
  size = '12px',
  title,
  darkMode,
}: SpinLoaderProps): JSX.Element {
  return (
    <div
      className={cx(spinLoaderStyle, darkMode ? darkStyles : lightStyles)}
      style={{
        width: size,
        height: size,
      }}
      title={title}
    />
  );
}

const SpinLoader = withTheme(UnstyledSpinLoader) as typeof UnstyledSpinLoader;

export { SpinLoader };
