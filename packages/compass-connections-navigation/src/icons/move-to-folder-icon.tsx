import React from 'react';
import type { LGGlyph } from '@mongodb-js/compass-components';
import { createGlyphComponent } from '@mongodb-js/compass-components';

export const MoveToFolderIcon: LGGlyph.Component = createGlyphComponent(
  'MoveToFolder',
  (props) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.17157C6.5694 2 6.95093 2.15804 7.23223 2.43934L8.29289 3.5H13C13.8284 3.5 14.5 4.17157 14.5 5V12C14.5 12.8284 13.8284 13.5 13 13.5H3C2.17157 13.5 1.5 12.8284 1.5 12V3.5Z" />
      <path d="M5.5 8.5H10.5M9 7L10.5 8.5L9 10" />
    </svg>
  )
);
