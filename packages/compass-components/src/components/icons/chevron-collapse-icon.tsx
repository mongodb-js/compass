import React from 'react';
import { createGlyphComponent } from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../../hooks/use-theme';

export const ChevronCollapse = createGlyphComponent(
  'ChevronCollapse',
  (props) => {
    const isDarkMode = useDarkMode();
    const strokeColor = isDarkMode ? palette.gray.light1 : palette.gray.dark1;
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M4.25 3.25L8 6.5L11.75 3.25M4.25 12.75L8 9.5L11.75 12.75"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);
