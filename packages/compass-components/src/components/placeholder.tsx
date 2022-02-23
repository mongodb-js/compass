/* eslint-disable react/prop-types */
import type { CSSProperties } from 'react';
import React, { useMemo } from 'react';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { uiColors } from '@leafygreen-ui/palette';

// Ratio of showing a highlight passing through the placeholder to background color
const scale = 4;

const percent = (num: number): string => (num * 100).toFixed(3) + '%';

const move = keyframes({
  from: {
    backgroundPosition: `${percent(scale)} 0`,
  },
  to: {
    backgroundPosition: '0 0',
  },
});

const placeholder = css({
  '--gradient-start': uiColors.gray.light3,
  '--gradient-end': 'rgba(235, 241, 239, 1)',
  alignSelf: 'center',
  borderRadius: 3,
  maxWidth: '80%',
  backgroundColor: 'var(--gradient-start)',
  backgroundImage: `linear-gradient(
        to right,
        var(--gradient-start) 0%,
        var(--gradient-end) ${percent(1 / scale / 2)},
        var(--gradient-start) ${percent(1 / scale)},
        var(--gradient-start) 100%
    )`,
  backgroundSize: `${percent(scale)} 100%`,
  backgroundPosition: '0 0',
  animation: `${move} ${scale}s infinite linear`,
});

const placeholderDarkMode = css({
  '--gradient-start': 'rgba(38, 55, 66, 1)',
  '--gradient-end': 'rgba(47, 64, 74, 1)',
});

function getBoundRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export const Placeholder: React.FunctionComponent<
  Omit<
    React.HTMLProps<HTMLDivElement>,
    'minChar' | 'maxChar' | 'width' | 'height'
  > & {
    minChar?: number;
    maxChar?: number;
    width?: CSSProperties['width'];
    height?: CSSProperties['height'];
    darkMode?: boolean;
  }
> = ({
  className,
  minChar = 5,
  maxChar = 15,
  width: propsWidth,
  height: propsHeight = spacing[3],
  darkMode,
  ...props
}) => {
  const width = useMemo(() => {
    return propsWidth || `${Math.round(getBoundRandom(minChar, maxChar))}ch`;
  }, [minChar, maxChar, propsWidth]);

  return (
    <div
      {...props}
      role="presentation"
      data-testid="placeholder"
      className={cx(placeholder, className, darkMode && placeholderDarkMode)}
      style={{ width, height: propsHeight }}
    ></div>
  );
};
