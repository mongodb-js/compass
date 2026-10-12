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

/**
 * $indexStats only reports usage for the node the client reads from, so indexes
 * used exclusively on other nodes look unused in the table. See CLOUDP-360188.
 */
const IndexStatsNodeBanner = () => {
  const darkMode = useDarkMode();

  return (
    <Body
      className={cx(noticeStyles, darkMode && noticeDarkModeStyles)}
      data-testid="index-stats-node-banner"
    >
      <Icon glyph="ImportantWithCircle" size="small" />
      IndexStats are based off only the current connected node
    </Body>
  );
};

export default IndexStatsNodeBanner;
