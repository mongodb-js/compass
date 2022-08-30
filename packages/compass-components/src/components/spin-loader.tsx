import React from 'react';
import { css, keyframes } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

interface SpinLoaderProps {
  size?: string;
  title?: string;
}

const shellLoaderSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinLoaderStyle = css`
  border: 2px solid transparent;
  border-top: 2px solid ${uiColors.gray.dark3};
  border-radius: 50%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: inline-block;

  animation: ${shellLoaderSpin} 700ms ease infinite;
`;

function SpinLoader({ size = '12px', title }: SpinLoaderProps): JSX.Element {
  return (
    <div
      className={spinLoaderStyle}
      style={{
        width: size,
        height: size,
      }}
      title={title}
    />
  );
}

export { SpinLoader };
