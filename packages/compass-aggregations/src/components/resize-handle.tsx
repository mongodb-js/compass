import React from 'react';
import { css, palette, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  position: 'absolute',
  background: palette.gray.light2,
  width: '1.1px',
  height: '100%',
  marginRight: spacing[1],
  '&:hover': {
    backgroundColor: palette.gray.light1,
  },
  '&:active': {
    backgroundColor: palette.gray.light1,
  },
});

const ResizeHandle = function () {
  return <div className={containerStyles} />;
};

export default ResizeHandle;
