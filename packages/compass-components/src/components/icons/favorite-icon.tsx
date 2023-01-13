import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';

import { useDarkMode } from '../../hooks/use-theme';

function FavoriteIcon({
  // When it's a favorite, the star is filled in with gold.
  isFavorite = false,
  favoriteColor = palette.yellow.base,
  showCircle = true,
  size = spacing[4],
}: {
  isFavorite?: boolean;
  favoriteColor?: string;
  showCircle?: boolean;
  size?: number;
}): React.ReactElement {
  const darkMode = useDarkMode();
  const stroke = darkMode ? palette.white : palette.black;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {showCircle && (
        <path
          d="M12 22.6667C17.891 22.6667 22.6667 17.891 22.6667 12C22.6667 6.10897 17.891 1.33334 12 1.33334C6.10897 1.33334 1.33334 6.10897 1.33334 12C1.33334 17.891 6.10897 22.6667 12 22.6667Z"
          stroke={stroke}
          strokeMiterlimit="10"
        />
      )}
      <path
        id="favoriteIconStar"
        d="M11.9195 15.6372L8.89689 17.3104C8.77598 17.3831 8.62053 17.274 8.63781 17.1103L9.20779 13.5639C9.22506 13.5094 9.19051 13.4366 9.15597 13.4003L6.7206 10.8905C6.61697 10.7814 6.66879 10.5995 6.82424 10.5813L10.2096 10.0721C10.2614 10.0721 10.3132 10.0175 10.3477 9.98118L11.8677 6.76215C11.9368 6.63485 12.1095 6.63485 12.1786 6.76215L13.664 9.96299C13.6813 10.0175 13.7331 10.0539 13.8022 10.0539L17.1875 10.5631C17.3257 10.5813 17.3775 10.7632 17.2911 10.8723L14.8212 13.4003C14.7867 13.4366 14.7694 13.5094 14.7694 13.5639L15.3394 17.1103C15.3567 17.2558 15.2185 17.3649 15.0803 17.3104L12.075 15.6372C12.0231 15.6008 11.9713 15.6008 11.9195 15.6372Z"
        stroke={isFavorite ? favoriteColor : stroke}
        fill={isFavorite ? favoriteColor : 'none'}
        strokeMiterlimit="10"
      />
    </svg>
  );
}

export { FavoriteIcon };
