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
  isLegacy?: boolean;
  style?: CSSProperties;
}> = ({ level, style, isLegacy }) => {
  const itemPaddingClass = useMemo(
    () => getItemPaddingClass({ level, isPlaceholder: true, isLegacy }),
    [level, isLegacy]
  );

  return (
    <div className={cx(placeholderItem, itemPaddingClass)} style={style}>
      <Placeholder />
    </div>
  );
};
