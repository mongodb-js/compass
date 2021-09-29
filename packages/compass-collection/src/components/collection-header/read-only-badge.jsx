import React from 'react';
import { Badge, BadgeVariant } from '@mongodb-js/compass-components';

import styles from './collection-header.module.less';

function ReadOnlyBadge() {
  return (
    <Badge
      className={styles['collection-header-badge']}
      variant={BadgeVariant.LightGray}
    >READ-ONLY</Badge>
  );
}

export default ReadOnlyBadge;
