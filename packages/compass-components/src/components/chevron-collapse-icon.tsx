import React from 'react';
import { createGlyphComponent } from '..';

export const ChevronCollapse = createGlyphComponent(
  'ChevronCollapse',
  (props) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.25 3.25L8 6.5L11.75 3.25M4.25 12.75L8 9.5L11.75 12.75"
        stroke="#5C6C75"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
);
