import React from 'react';
import { palette } from '@leafygreen-ui/palette';
import { createGlyphComponent } from '@leafygreen-ui/icon';
import type { LGGlyph } from '@leafygreen-ui/icon';

import { useDarkMode } from '../../hooks/use-theme';

// A custom clone icon that is more distinct from the copy icon than the one
// leafygreen provides. It renders two stacked sheets with an "add" badge to
// convey that cloning creates a new document.
export const CloneIcon: LGGlyph.Component = createGlyphComponent(
  'Clone',
  (props) => {
    const darkMode = useDarkMode();
    const color = darkMode ? palette.white : palette.black;
    // The plus and the ring around the badge use the inverse color so that the
    // badge reads as a distinct element sitting on top of the sheets in both
    // themes.
    const badgeColor = darkMode ? palette.black : palette.white;

    return (
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        {...props}
      >
        {/* Back sheet, only its top and right edges peek out behind the front
            sheet. */}
        <path
          d="M4.5 4.5V3Q4.5 1.5 6 1.5H10Q11.5 1.5 11.5 3V7Q11.5 8.5 10 8.5H8.5"
          stroke={color}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Front sheet */}
        <rect
          x="1.5"
          y="4.5"
          width="7"
          height="7"
          rx="1.5"
          stroke={color}
          strokeWidth="1.25"
        />
        {/* "Add" badge */}
        <circle
          cx="11"
          cy="11.5"
          r="3.25"
          fill={color}
          stroke={badgeColor}
          strokeWidth="1"
        />
        <path
          d="M11 10V13M9.5 11.5H12.5"
          stroke={badgeColor}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }
);
