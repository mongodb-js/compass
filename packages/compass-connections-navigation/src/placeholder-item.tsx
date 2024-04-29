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

const MULTIPLE_CONNECTION_PROPS = {
  gradientStart: 'var(--item-bg-color-active)',
  gradientEnd: 'var(--item-bg-color)',
  style: { filter: 'brightness(0.98)' },
} as const;

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

  return (
    <div
      className={cx(placeholderItem)}
      style={{ ...style, ...itemPaddingStyles }}
    >
      <Placeholder {...(isSingleConnection ? {} : MULTIPLE_CONNECTION_PROPS)} />
    </div>
  );
};
