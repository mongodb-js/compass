import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';

export const robotSVGStyles = css({
  rect: {
    transition: 'fill 0.16s ease-in',
  },
});

export const robotSVGDarkModeStyles = css({
  rect: {
    fill: palette.green.dark1,
  },

  '&:hover': {
    rect: {
      fill: palette.green.base,
    },
  },
});

export const robotSVGLightModeStyles = css({
  rect: {
    fill: palette.green.dark2,
  },
  '&:hover': {
    rect: {
      fill: palette.green.dark1,
    },
  },
});

export const DEFAULT_ROBOT_SIZE = 20;

// Note: This is duplicated below as a string for HTML.
const RobotSVG = ({
  darkMode,
  size = DEFAULT_ROBOT_SIZE,
}: {
  darkMode?: boolean;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    className={cx(
      robotSVGStyles,
      darkMode ? robotSVGDarkModeStyles : robotSVGLightModeStyles
    )}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="20" height="20" rx="4" />
    <path
      d="M6.66675 6.66669H13.3334C13.687 6.66669 14.0262 6.80716 14.2762 7.05721C14.5263 7.30726 14.6667 7.6464 14.6667 8.00002V8.66669L15.3334 9.33335V11.3334L14.6667 12V14C14.6667 14.3536 14.5263 14.6928 14.2762 14.9428C14.0262 15.1929 13.687 15.3334 13.3334 15.3334H6.66675C6.31313 15.3334 5.97399 15.1929 5.72394 14.9428C5.47389 14.6928 5.33341 14.3536 5.33341 14V12L4.66675 11.3334V9.33335L5.33341 8.66669V8.00002C5.33341 7.6464 5.47389 7.30726 5.72394 7.05721C5.97399 6.80716 6.31313 6.66669 6.66675 6.66669Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.66675 12.6667H11.3334"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.99992 6.66667L7.33325 4"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 6.66667L12.6667 4"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.75" cy="9.75" r="0.75" fill="white" />
    <circle cx="12.25" cy="9.75" r="0.75" fill="white" />
  </svg>
);

// Note: This is duplicated above for react.
const getRobotSVGString =
  () => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="display: inline-block; margin-top: -2px; margin-bottom: -10px" xmlns="http://www.w3.org/2000/svg">
<rect width="20" height="20" rx="4" />
<path d="M6.66675 6.66669H13.3334C13.687 6.66669 14.0262 6.80716 14.2762 7.05721C14.5263 7.30726 14.6667 7.6464 14.6667 8.00002V8.66669L15.3334 9.33335V11.3334L14.6667 12V14C14.6667 14.3536 14.5263 14.6928 14.2762 14.9428C14.0262 15.1929 13.687 15.3334 13.3334 15.3334H6.66675C6.31313 15.3334 5.97399 15.1929 5.72394 14.9428C5.47389 14.6928 5.33341 14.3536 5.33341 14V12L4.66675 11.3334V9.33335L5.33341 8.66669V8.00002C5.33341 7.6464 5.47389 7.30726 5.72394 7.05721C5.97399 6.80716 6.31313 6.66669 6.66675 6.66669Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.66675 12.6667H11.3334" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.99992 6.66667L7.33325 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 6.66667L12.6667 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="7.75" cy="9.75" r="0.75" fill="white"/>
<circle cx="12.25" cy="9.75" r="0.75" fill="white"/>
</svg>`;

export { getRobotSVGString, RobotSVG };
