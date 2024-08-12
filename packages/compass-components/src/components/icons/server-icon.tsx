import React from 'react';
import { useDarkMode } from '../../hooks/use-theme';
import { palette } from '@leafygreen-ui/palette';
import { css, cx } from '@leafygreen-ui/emotion';

const iconStyles = css({
  flex: 'none',
});

const ServerIcon = ({
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
      <g clipPath="url(#clip0_842_15453)">
        <path
          d="M11.6665 1.1665H2.33317C1.68884 1.1665 1.1665 1.68884 1.1665 2.33317V4.6665C1.1665 5.31084 1.68884 5.83317 2.33317 5.83317H11.6665C12.3108 5.83317 12.8332 5.31084 12.8332 4.6665V2.33317C12.8332 1.68884 12.3108 1.1665 11.6665 1.1665Z"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.6665 8.1665H2.33317C1.68884 8.1665 1.1665 8.68884 1.1665 9.33317V11.6665C1.1665 12.3108 1.68884 12.8332 2.33317 12.8332H11.6665C12.3108 12.8332 12.8332 12.3108 12.8332 11.6665V9.33317C12.8332 8.68884 12.3108 8.1665 11.6665 8.1665Z"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 3.5H3.50667"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 10.5H3.50667"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_842_15453">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export { ServerIcon };
