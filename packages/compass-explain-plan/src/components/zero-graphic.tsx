import React, { useMemo } from 'react';
import { palette, useDarkMode } from '@mongodb-js/compass-components';

const ZeroGraphic: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const fillColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );

  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M36 55C38.7614 55 41 52.7614 41 50C41 47.2386 38.7614 45 36 45C33.2386 45 31 47.2386 31 50C31 52.7614 33.2386 55 36 55Z"
        fill={palette.green.base}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M35.5 44.5224C32.6967 44.775 30.5 47.131 30.5 50C30.5 53.0376 32.9624 55.5 36 55.5C39.0376 55.5 41.5 53.0376 41.5 50C41.5 47.131 39.3032 44.775 36.5 44.5224V31H35.5V44.5224ZM31.5 50C31.5 47.5147 33.5147 45.5 36 45.5C38.4853 45.5 40.5 47.5147 40.5 50C40.5 52.4853 38.4853 54.5 36 54.5C33.5147 54.5 31.5 52.4853 31.5 50Z"
        fill={fillColor}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 41.8C3.5 23.8984 17.9935 9.5 36 9.5C54.0065 9.5 68.5 23.8984 68.5 41.8C68.5 50.0086 65.3858 57.6807 60.2364 63.3366L60.0876 63.5H11.9124L11.7636 63.3366C6.61417 57.6807 3.5 50.0086 3.5 41.8ZM4.5014 41.5H11V42.5H4.50779C4.67738 50.113 7.6049 57.2039 12.3554 62.5H59.6446C64.3951 57.2039 67.3226 50.113 67.4922 42.5H61V41.5H67.4986C67.4205 33.1419 64.0811 25.5882 58.6771 20.03L54.3536 24.3536L53.6464 23.6464L57.9687 19.3242C52.4141 13.9636 44.8643 10.6317 36.5 10.5038V17H35.5V10.5038C27.1357 10.6317 19.5859 13.9636 14.0313 19.3242L18.3536 23.6464L17.6464 24.3536L13.3229 20.03C7.91892 25.5882 4.57952 33.1419 4.5014 41.5Z"
        fill={fillColor}
      />
    </svg>
  );
};

export { ZeroGraphic };
