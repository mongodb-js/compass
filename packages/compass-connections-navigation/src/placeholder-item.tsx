/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Placeholder, css, cx } from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';
import { getItemPaddingClass } from './utils';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: COLLECTION_ROW_HEIGHT,
});

export const PlaceholderItem: React.FunctionComponent<{
  level: number;
  style?: CSSProperties;
}> = ({ level, style }) => {
  const itemPaddingClass = useMemo(
    () => getItemPaddingClass({ level, isPlaceholder: true }),
    [level]
  );

  return (
    <div className={cx(placeholderItem, itemPaddingClass)} style={style}>
      <Placeholder />
    </div>
  );
};
