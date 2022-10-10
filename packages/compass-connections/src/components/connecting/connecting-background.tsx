import React from 'react';
import { css, keyframes } from '@mongodb-js/compass-components';

const connectingBackgroundSvgStyles = css({
  position: 'fixed',
  zIndex: 500,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
});

const opacityFadeInKeyframes = keyframes({
  '0%': {
    opacity: 0,
  },
  '100%': {
    opacity: 1,
  },
});

const connectingBackgroundGradientStyles = css({
  opacity: 0.9,
  animation: `${opacityFadeInKeyframes} 500ms ease-out`,
});

function ConnectingBackground(): React.ReactElement {
  return (
    <svg
      className={connectingBackgroundSvgStyles}
      data-testid="connecting-background-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 310.34 540.72"
    >
      <defs>
        <linearGradient
          id="linearGradient"
          x1="-0.69"
          y1="540.32"
          x2="311.03"
          y2="0.4"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.09" stopColor="#f9ebff" stopOpacity="0.34" />
          <stop offset="0.74" stopColor="#c3e7fe" stopOpacity="0.61">
            <animate
              attributeName="offset"
              from="0.74"
              to="0.74"
              dur="5s"
              repeatCount="indefinite"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              values="0.74;0.45;0.74"
            />
          </stop>
          <stop offset="1" stopColor="#fef7db" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <g>
        <rect
          fill="url(#linearGradient)"
          className={connectingBackgroundGradientStyles}
          width="310.34"
          height="540.72"
        />
      </g>
    </svg>
  );
}

export default ConnectingBackground;
