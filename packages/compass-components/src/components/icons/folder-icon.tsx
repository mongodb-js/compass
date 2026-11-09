import React from 'react';
import { palette } from '@leafygreen-ui/palette';
import { css, cx } from '@leafygreen-ui/emotion';
import { useDarkMode } from '../../hooks/use-theme';

const iconStyles = css({
  flex: 'none',
});

const FolderIcon = ({
  color,
  size = 16,
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) => {
  const darkMode = useDarkMode();
  const stroke = color || (darkMode ? palette.white : palette.gray.dark2);
  return (
    <svg
      className={cx(iconStyles, className)}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <path
        d="M1.5 12V4.5C1.5 3.67 2.17 3 3 3H6.5C6.78 3 7 3.22 7 3.5V4.5H13C13.83 4.5 14.5 5.17 14.5 6V12C14.5 12.83 13.83 13.5 13 13.5H3C2.17 13.5 1.5 12.83 1.5 12Z"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 6.5H14.5"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

export { FolderIcon };
