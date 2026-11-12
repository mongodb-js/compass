import React from 'react';
import { palette } from '@leafygreen-ui/palette';
import { css, cx } from '@leafygreen-ui/emotion';
import { useDarkMode } from '../../hooks/use-theme';

const iconStyles = css({
  flex: 'none',
});

const FolderPlusIcon = ({
  color,
  size = 24,
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
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <path
        d="M7 9.78307C7 8.80238 7.80625 8 8.79167 8H11.6583C12.1063 8 12.5542 8.17831 12.9125 8.53492L14.1667 9.78307H19.5417C20.5271 9.78307 21.3334 10.5854 21.3334 11.5661V18.6984C21.3334 19.6791 20.5271 20.4815 19.5417 20.4815H8.79167C7.80625 20.4815 7 19.6791 7 18.6984V9.78307Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.75 12C13.4739 12 13.25 12.2239 13.25 12.5V14.25H11.5C11.2239 14.25 11 14.4739 11 14.75V15.25C11 15.5261 11.2239 15.75 11.5 15.75H13.25V17.5C13.25 17.7761 13.4739 18 13.75 18H14.25C14.5261 18 14.75 17.7761 14.75 17.5V15.75H16.5C16.7761 15.75 17 15.5261 17 15.25V14.75C17 14.4739 16.7761 14.25 16.5 14.25H14.75V12.5C14.75 12.2239 14.5261 12 14.25 12H13.75Z"
        fill={stroke}
      />
    </svg>
  );
};

export { FolderPlusIcon };
