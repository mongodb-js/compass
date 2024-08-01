import React from 'react';
import { useDarkMode } from '../../hooks/use-theme';
import { palette } from '@leafygreen-ui/palette';
import { css, cx } from '@leafygreen-ui/emotion';

const iconStyles = css({
  flex: 'none',
  width: 'auto',
});

const LogoIcon = ({
  color,
  className,
  height,
  ...props
}: {
  height: number;
  color?: string;
  size?: number;
  className?: string;
} & React.SVGProps<SVGSVGElement>) => {
  const darkMode = useDarkMode();
  const fill = color || (darkMode ? palette.white : palette.black);
  return (
    <svg
      className={cx(iconStyles, className, css(`height: ${height}px`))}
      height={height}
      viewBox="0 0 15 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.2779 3.56801C8.93285 1.97392 7.76219 0.354933 7.52557 0.0186807C7.50066 -0.00622689 7.4633 -0.00622689 7.43839 0.0186807C7.20177 0.354933 6.04357 1.97392 4.69856 3.56801C-6.8461 18.2759 6.51681 28.1891 6.51681 28.1891L6.6289 28.2639C6.72853 29.7957 6.9776 32 6.9776 32H7.47576H7.97391C7.97391 32 8.22298 29.8081 8.32261 28.2639L8.4347 28.1767C8.44715 28.1891 21.8225 18.2759 10.2779 3.56801ZM7.48821 27.9774C7.48821 27.9774 6.89043 27.4668 6.72853 27.2053V27.1804L7.45085 11.1648C7.45085 11.115 7.52557 11.115 7.52557 11.1648L8.24789 27.1804V27.2053C8.08599 27.4668 7.48821 27.9774 7.48821 27.9774Z"
        fill={fill}
      />
    </svg>
  );
};

export { LogoIcon };
