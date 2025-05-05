import React, { useMemo } from 'react';
import { palette, useDarkMode } from '@mongodb-js/compass-components';

const Insight: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const strokeColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );
  // Green color that doesn't change with dark mode
  const fillColor = palette.green.base;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
    >
      <path
        d="M42 64C43.1 64 44 64.9 44 66C44 67.1 43.1 68 42 68H30C28.9 68 28 67.1 28 66C28 64.9 28.9 64 30 64M27.5 56H44.5M42.3297 64C43.4901 64 44.4396 63.0357 44.4396 61.8571V55.75C44.4396 55.1071 44.545 54.5714 44.8615 54.0357L51.8242 40.2143C52.4571 38.9286 53.0901 37.75 53.8286 36.5714C55.9384 33.1429 57.0989 29.0714 56.9934 24.6786C56.5714 14.0714 47.3934 4.53571 37.0549 4C36.633 4 35.8945 4 35.8945 4C35.8945 4 35.156 4 34.7341 4C24.5011 4.53571 15.3231 14.0714 15.0066 24.5714C14.9011 28.9643 16.0616 33.0357 18.1714 36.4643C18.9099 37.6429 19.5429 38.9286 20.1758 40.1071L27.1385 54.0357C27.455 54.5714 27.5604 55.1071 27.5604 55.75V61.8571C27.5604 63.0357 28.5099 64 29.6703 64H42.3297Z"
        stroke={strokeColor}
        strokeMiterlimit="10"
      />
      <path
        d="M44 56L48 24C48 26.2 46.2 28 44 28C41.8 28 40 26.2 40 24C40 26.2 38.2 28 36 28C33.8 28 32 26.2 32 24C32 26.2 30.2 28 28 28C25.8 28 24 26.2 24 24L28 56"
        fill={fillColor}
      />
      <path
        d="M44 56L48 24C48 26.2 46.2 28 44 28C41.8 28 40 26.2 40 24C40 26.2 38.2 28 36 28C33.8 28 32 26.2 32 24C32 26.2 30.2 28 28 28C25.8 28 24 26.2 24 24L28 56H44Z"
        stroke={strokeColor}
        strokeMiterlimit="10"
      />
    </svg>
  );
};

export default Insight;
