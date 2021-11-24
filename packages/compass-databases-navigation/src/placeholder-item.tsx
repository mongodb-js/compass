/* eslint-disable react/prop-types */
import React, { CSSProperties, useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { uiColors, spacing } from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: COLLECTION_ROW_HEIGHT,
  paddingLeft: spacing[5],
});

const placeholderItemContent = css({
  display: 'block',
  height: spacing[3],
  backgroundColor: uiColors.gray.dark1,
  borderRadius: 3,
});

function getBoundRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export const PlaceholderItem: React.FunctionComponent<{
  style?: CSSProperties;
}> = ({ style }) => {
  const width = useMemo(() => {
    return `${getBoundRandom(30, 80)}%`;
  }, []);

  return (
    <div role="presentation" className={placeholderItem} style={style}>
      <span className={placeholderItemContent} style={{ width }} />
    </div>
  );
};
