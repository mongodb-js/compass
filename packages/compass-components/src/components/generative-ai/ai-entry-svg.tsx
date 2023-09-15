import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';

export const aiEntrySVGStyles = css({
  '#entry-content': {
    transition: 'fill 0.16s ease-in, stroke 0.16s ease-in',
  },
});

export const aiEntrySVGDarkModeStyles = css({
  '#entry-content': {
    fill: palette.green.dark1,
    stroke: palette.green.dark1,
  },

  '&:hover': {
    '#entry-content': {
      fill: palette.green.base,
      stroke: palette.green.base,
    },
  },
});

export const aiEntrySVGLightModeStyles = css({
  '#entry-content': {
    fill: palette.green.dark2,
    stroke: palette.green.dark2,
  },
  '&:hover': {
    '#entry-content': {
      fill: palette.green.dark1,
      stroke: palette.green.dark1,
    },
  },
});

export const DEFAULT_AI_ENTRY_SIZE = 20;

// Note: This is duplicated below as a string for HTML.
const AIEntrySVG = ({
  darkMode,
  size = DEFAULT_AI_ENTRY_SIZE,
}: {
  darkMode?: boolean;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cx(
      aiEntrySVGStyles,
      darkMode ? aiEntrySVGDarkModeStyles : aiEntrySVGLightModeStyles
    )}
  >
    <path
      d="M14 10C14 10.3536 13.8595 10.6928 13.6095 10.9428C13.3594 11.1929 13.0203 11.3333 12.6667 11.3333H9.00001L5.00001 14V11.3333C5.00001 11.3333 4.87152 11.3333 3.83513 11.3333C3.47871 11.3173 2.93292 11.4037 2.5 11C2.06708 10.5963 2 10 2 9.5C2 9 2.00001 3.33333 2.00001 3.33333C2.00001 2.97971 2.14048 2.64057 2.39053 2.39052C2.64058 2.14048 2.97972 2 3.33334 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V10Z"
      fill="#00684A"
      stroke="#00684A"
      id="entry-content"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.75 8.53L11.5 6.78L9.75 5.03"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
    <path
      d="M6.25 5.03L4.5 6.78L6.25 8.53"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

// Note: This is duplicated above for react.
const getAIEntrySVGString =
  () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 10C14 10.3536 13.8595 10.6928 13.6095 10.9428C13.3594 11.1929 13.0203 11.3333 12.6667 11.3333H9.00001L5.00001 14V11.3333C5.00001 11.3333 4.87152 11.3333 3.83513 11.3333C3.47871 11.3173 2.93292 11.4037 2.5 11C2.06708 10.5963 2 10 2 9.5C2 9 2.00001 3.33333 2.00001 3.33333C2.00001 2.97971 2.14048 2.64057 2.39053 2.39052C2.64058 2.14048 2.97972 2 3.33334 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V10Z" fill="#00684A" stroke="#00684A" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" id="entry-content"/>
<path d="M9.75 8.53L11.5 6.78L9.75 5.03" stroke="white" stroke-width="1.5" stroke-linecap="square"/>
<path d="M6.25 5.03L4.5 6.78L6.25 8.53" stroke="white" stroke-width="1.5" stroke-linecap="square"/>
</svg>
`;

export { getAIEntrySVGString, AIEntrySVG };
