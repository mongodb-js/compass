import React from 'react';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';

import styles from './collection-header.less';

function TimeSeriesBadge() {
  return (
    <Badge
      className={styles['collection-header-badge']}
      variant={BadgeVariant.DarkGray}
    >
      <Icon
        glyph="TimeSeries"
        title="Time-Series Collection"
      />&nbsp;TIME-SERIES
    </Badge>
  );
}

export default TimeSeriesBadge;
