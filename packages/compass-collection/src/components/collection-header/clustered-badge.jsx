import React from 'react';
import { Badge, BadgeVariant, Icon } from '@mongodb-js/compass-components';

import styles from './collection-header.module.less';

function ClusteredBadge() {
  return (
    <Badge
      className={styles['collection-header-badge']}
      variant={BadgeVariant.DarkGray}
    >
      CLUSTERED
    </Badge>
  );
}

export default ClusteredBadge;
