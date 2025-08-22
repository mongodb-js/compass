import React from 'react';

import { createGlyphComponent } from '@mongodb-js/compass-components';

export const ReturnIcon = createGlyphComponent('Return', (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g id="Return">
      <path
        id="Union"
        d="M5 2C4.44772 2 4 2.44772 4 3C4 3.55228 4.44772 4 5 4H10C11.3807 4 12.5 5.11929 12.5 6.5C12.5 7.88071 11.3807 9 10 9H5.20328L6.65079 7.75927C7.07012 7.39985 7.11868 6.76855 6.75926 6.34923C6.39983 5.9299 5.76853 5.88134 5.34921 6.24076L1.84921 9.24076C1.62756 9.43074 1.5 9.70809 1.5 10C1.5 10.2919 1.62756 10.5693 1.84921 10.7593L5.34921 13.7593C5.76853 14.1187 6.39983 14.0701 6.75926 13.6508C7.11868 13.2315 7.07012 12.6002 6.65079 12.2408L5.20324 11H10C12.4853 11 14.5 8.98528 14.5 6.5C14.5 4.01472 12.4853 2 10 2H5Z"
        fill="currentColor"
      />
    </g>
  </svg>
));
