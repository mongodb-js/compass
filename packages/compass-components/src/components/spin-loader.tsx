import React, { Component } from 'react';
import { css, keyframes } from '@emotion/css';
import { uiColors } from '@leafygreen-ui/palette';

interface SpinLoaderProps {
  className: string;
  size?: string;
}

const shellLoaderSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinLoaderStyle = css`
  border: 2px solid transparent;
  border-top: 2px solid ${uiColors.green.light2};
  border-radius: 50%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: inline-block;

  animation: ${shellLoaderSpin} 700ms ease infinite;
`;

export default class SpinLoader extends Component<SpinLoaderProps> {
  static defaultProps = {
    size: '12px',
  };

  render(): JSX.Element {
    const { size } = this.props;

    return (
      <div
        className={spinLoaderStyle}
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }
}
