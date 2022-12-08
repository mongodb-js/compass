import React from 'react';
import { css, cx, palette, spacing, useDarkMode } from '@mongodb-js/compass-components';

const containerStyles = css({
  position: 'absolute',
  width: '1.1px',
  height: '100%',
  marginRight: spacing[1],
});

const containerStylesDark = css({
  background: palette.gray.dark2,
  '&:hover': {
    backgroundColor: palette.gray.dark1,
  },
  '&:active': {
    backgroundColor: palette.gray.dark1,
  },
});

const containerStylesLight = css({
  background: palette.gray.light2,
  '&:hover': {
    backgroundColor: palette.gray.light1,
  },
  '&:active': {
    backgroundColor: palette.gray.light1,
  },
});

const ResizeHandle = function () {
  const darkMode = useDarkMode();
  return <div className={cx(containerStyles, darkMode ? containerStylesDark : containerStylesLight)} />;
};

export default ResizeHandle;
