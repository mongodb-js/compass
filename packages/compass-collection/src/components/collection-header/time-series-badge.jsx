import React from 'react';
import { Badge, BadgeVariant, Icon } from '@mongodb-js/compass-components';

import styles from './collection-header.module.less';

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
