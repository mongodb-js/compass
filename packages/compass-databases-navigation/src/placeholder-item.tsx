/* eslint-disable react/prop-types */
import React, { CSSProperties } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing, Placeholder } from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: COLLECTION_ROW_HEIGHT,
  paddingLeft: spacing[5],
});

export const PlaceholderItem: React.FunctionComponent<{
  style?: CSSProperties;
}> = ({ style }) => {
  return (
    <div className={placeholderItem} style={style}>
      <Placeholder darkMode></Placeholder>
    </div>
  );
};
