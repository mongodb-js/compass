import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Placeholder, css, cx } from '@mongodb-js/compass-components';
import { ROW_HEIGHT } from './constants';
import { getItemPaddingStyles } from './utils';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: ROW_HEIGHT,
  backgroundColor: 'var(--item-bg-color)',
  color: 'var(--item-color)',
});

export const PlaceholderItem: React.FunctionComponent<{
  level: number;
  isSingleConnection?: boolean;
  style?: CSSProperties;
}> = ({ level, style, isSingleConnection }) => {
  const itemPaddingStyles = useMemo(
    () =>
      getItemPaddingStyles({ level, isPlaceholder: true, isSingleConnection }),
    [level, isSingleConnection]
  );

  const multiConnectionProps = {
    gradientStart: 'var(--item-bg-color-active)',
    gradientEnd: 'var(--item-bg-color)',
    style: { filter: 'brightness(0.98)' },
  };

  return (
    <div
      className={cx(placeholderItem)}
      style={{ ...style, ...itemPaddingStyles }}
    >
      <Placeholder {...(isSingleConnection ? {} : multiConnectionProps)} />
    </div>
  );
};
