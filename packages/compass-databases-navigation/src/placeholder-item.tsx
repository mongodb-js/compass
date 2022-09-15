/* eslint-disable react/prop-types */
import React from 'react';
import type { CSSProperties } from 'react';
import { spacing, Placeholder, css, cx } from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: COLLECTION_ROW_HEIGHT,
  paddingLeft: spacing[5],
});

const padding = {
  database: css({
    paddingLeft: spacing[4] + spacing[2],
  }),
  collection: css({
    paddingLeft: spacing[4] + spacing[4] + spacing[1],
  }),
} as const;

export const PlaceholderItem: React.FunctionComponent<{
  type?: 'database' | 'collection';
  style?: CSSProperties;
}> = ({ type = 'collection', style }) => {
  return (
    <div className={cx(placeholderItem, padding[type])} style={style}>
      <Placeholder />
    </div>
  );
};
