import React, { useMemo } from 'react';
import { palette, useDarkMode } from '@mongodb-js/compass-components';

const Flexibility: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const strokeColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );
  // Using green that doesn't change with dark mode
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
        d="M4 60H48.5C51.8 60 54.8 58.7027 57 56.5073C59.2 54.3119 60.5 51.3181 60.5 48.0249C60.5 41.4387 55.1 36.0499 48.5 36.0499L24 35.9501C17.4 35.9501 12 30.5613 12 23.9751C12 20.6819 13.3 17.6881 15.5 15.4927C17.7 13.2973 20.7 12 24 12H68M60 20L67.68 12.8C68.1067 12.4 68.1067 11.6 67.68 11.2L60 4M12 52L4.32 59.2C3.89333 59.6 3.89333 60.4 4.32 60.8L12 68"
        stroke={strokeColor}
        strokeMiterlimit="10"
      />
      <path
        d="M31.7835 22.6262L44.3054 35.2971C44.6903 35.6866 44.6903 36.3134 44.3054 36.7029L31.7835 49.3738C30.8991 50.2688 29.4539 50.2688 28.5694 49.3738C27.6997 48.4937 27.6997 47.0777 28.5694 46.1976L37.9524 36.7029C38.3374 36.3134 38.3374 35.6866 37.9524 35.2971L28.5694 25.8024C27.6997 24.9223 27.6997 23.5063 28.5694 22.6262C29.4539 21.7312 30.8991 21.7312 31.7835 22.6262Z"
        fill={fillColor}
        stroke={strokeColor}
      />
    </svg>
  );
};

export default Flexibility;
