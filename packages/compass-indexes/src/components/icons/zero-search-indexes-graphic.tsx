import React, { useMemo } from 'react';

import { palette, useDarkMode } from '@mongodb-js/compass-components';

const ZeroSearchIndexesGraphic: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const strokeColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      viewBox="0 0 40 40"
      fill="none"
    >
      <path
        d="M15.556 2.22217C8.19967 2.22217 2.22266 8.19918 2.22266 15.5555C2.22266 22.9118 8.19967 28.8888 15.556 28.8888C22.9123 28.8888 28.8893 22.9118 28.8893 15.5555C28.8893 8.19918 22.9123 2.22217 15.556 2.22217Z"
        fill={palette.green.base}
        stroke={strokeColor}
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="2.71655"
        cy="2.71655"
        r="2.71655"
        transform="matrix(0.707107 0.707107 0.707107 -0.707107 14.5 12.842)"
        stroke={strokeColor}
      />
      <line
        y1="-0.5"
        x2="7.90024"
        y2="-0.5"
        transform="matrix(-0.707107 0.707107 0.707107 0.707107 16.6445 14.9023)"
        stroke={strokeColor}
      />
      <line
        y1="-0.5"
        x2="2.71655"
        y2="-0.5"
        transform="matrix(0.707107 0.707107 0.707107 -0.707107 11.1719 19.8032)"
        stroke={strokeColor}
      />
      <line
        y1="-0.5"
        x2="2.71655"
        y2="-0.5"
        transform="matrix(0.707107 0.707107 0.707107 -0.707107 12.8906 18.1567)"
        stroke={strokeColor}
      />
      <path
        d="M25 25L37.7778 37.7778"
        stroke={strokeColor}
        strokeMiterlimit="10"
      />
    </svg>
  );
};

export { ZeroSearchIndexesGraphic };
