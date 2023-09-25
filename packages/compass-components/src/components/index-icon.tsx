import React from 'react';
import Icon from '@leafygreen-ui/icon';

type IndexDirection = number | unknown;

const IndexIcon = ({
  className,
  direction,
}: {
  className?: string;
  direction: IndexDirection;
}) => {
  return direction === 1 ? (
    <Icon
      className={className}
      glyph="ArrowUp"
      size="small"
      aria-label="Ascending index"
    />
  ) : direction === -1 ? (
    <Icon
      className={className}
      glyph="ArrowDown"
      size="small"
      aria-label="Descending index"
    />
  ) : (
    <span className={className}>({String(direction)})</span>
  );
};

export default IndexIcon;
