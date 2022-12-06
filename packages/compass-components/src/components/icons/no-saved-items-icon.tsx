import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import React, { useMemo } from 'react';

import { useDarkMode } from '../../hooks/use-theme';

type NoSavedItemsIconProps = {
  size?: number;
};

const defaultSize = spacing[4] * 3;

const NoSavedItemsIcon: React.FunctionComponent<NoSavedItemsIconProps> = ({
  size = defaultSize,
}) => {
  const darkMode = useDarkMode();

  const strokeColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M47 53C54.1797 53 60 47.1797 60 40C60 32.8203 54.1797 27 47 27C39.8203 27 34 32.8203 34 40C34 47.1797 39.8203 53 47 53Z"
        fill={palette.green.base}
        stroke={strokeColor}
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M56 49L68 61" stroke={strokeColor} />
      <path
        d="M4 35.9501H6.2M6.2 35.9501C9.4 35.9501 12.1 33.3553 12.1 30.0619V19.5828C12.1 14.8922 15.9 11 20.7 11M6.2 35.9501C9.4 35.9501 12.1 38.5449 12.1 41.8383V52.4172C12.1 57.1078 15.9 61 20.7 61M54.0001 35.9501H51.8001M51.8001 35.9501C48.6001 35.9501 45.9001 38.5449 45.9001 41.8383V52.4172C45.9001 57.1078 42.1001 61 37.3001 61M51.8001 35.9501C48.6001 35.9501 45.9 33.3553 45.9 30.0619V19.5828C45.9 14.8922 42.1 11 37.3 11"
        stroke={strokeColor}
        strokeMiterlimit="10"
      />
    </svg>
  );
};

export { NoSavedItemsIcon };
