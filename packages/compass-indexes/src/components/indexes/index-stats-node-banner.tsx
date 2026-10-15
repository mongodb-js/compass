import React from 'react';
import {
  Body,
  Icon,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

const noticeStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  color: palette.yellow.dark2,
});

const noticeDarkModeStyles = css({
  color: palette.yellow.light2,
});

const IndexStatsNodeBanner = () => {
  const darkMode = useDarkMode();

  return (
    <Body
      className={cx(noticeStyles, darkMode && noticeDarkModeStyles)}
      data-testid="index-stats-node-banner"
    >
      <Icon glyph="ImportantWithCircle" size="small" />
      IndexStats are based off only the currently connected node
    </Body>
  );
};

export default IndexStatsNodeBanner;
