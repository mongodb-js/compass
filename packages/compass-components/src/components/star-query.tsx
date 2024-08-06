import React, { useState, useEffect } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { Icon, spacing } from '@mongodb-js/compass-components';

const starStyles = css({
  display: 'flex',
  alignItems: 'center',
  padding: spacing[100],
  cursor: 'pointer',
  transition: 'color 0.3s',
  '&:hover': {
    color: '#FFD700',
  },
});

type StarQueryProps = {
  showStar: boolean;
  // darkMode?: boolean;
  // onPopoverOpenChange?: (open: boolean) => void;
};

const StarQuery: React.FunctionComponent<StarQueryProps> = ({ showStar }) => {
  if (!showStar) {
    return null;
  }
  return (
    <div className={starStyles}>
      <Icon glyph="Favorite" fill="#ccc" />
    </div>
  );
};

export { StarQuery };
