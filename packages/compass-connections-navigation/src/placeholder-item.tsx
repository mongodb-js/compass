/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Placeholder, css, cx } from '@mongodb-js/compass-components';
import { ROW_HEIGHT } from './constants';
import { getItemPaddingStyles } from './utils';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: ROW_HEIGHT,
});

export const PlaceholderItem: React.FunctionComponent<{
  level: number;
  isLegacy?: boolean;
  style?: CSSProperties;
}> = ({ level, style, isLegacy }) => {
  const itemPaddingStyles = useMemo(
    () => getItemPaddingStyles({ level, isPlaceholder: true, isLegacy }),
    [level, isLegacy]
  );

  return (
    <div
      className={cx(placeholderItem)}
      style={{ ...style, ...itemPaddingStyles }}
    >
      <Placeholder />
    </div>
  );
};
