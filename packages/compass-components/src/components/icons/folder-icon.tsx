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
        d="M2.4 4.57C2.4 3.82 3.03 3.2 3.8 3.2H6.04C6.39 3.2 6.74 3.34 7.02 3.61L8 4.57H12.2C12.97 4.57 13.6 5.19 13.6 5.94V11.43C13.6 12.18 12.97 12.8 12.2 12.8H3.8C3.03 12.8 2.4 12.18 2.4 11.43V4.57Z"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.4 7.2H13.6"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { FolderIcon };
