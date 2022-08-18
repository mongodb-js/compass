import React from 'react';
import Icon from '@leafygreen-ui/icon';

type IndexDirection = number | string;

const IndexIcon = ({ direction }: { direction: IndexDirection }) => {
  return direction === 1 ? (
    <Icon glyph="ArrowUp" size="small" aria-label="Ascending index" />
  ) : direction === -1 ? (
    <Icon glyph="ArrowDown" size="small" aria-label="Descending index" />
  ) : (
    <>({String(direction)})</>
  );
};

export default IndexIcon;
