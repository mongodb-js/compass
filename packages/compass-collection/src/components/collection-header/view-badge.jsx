import React from 'react';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';
import { Icon } from '@mongodb-js/compass-components';

import styles from './collection-header.module.less';

function ViewBadge() {
  return (
    <Badge
      className={styles['collection-header-badge']}
      variant={BadgeVariant.DarkGray}
    >
      <Icon
        glyph="Visibility"
        title="View"
      />&nbsp;VIEW
    </Badge>
  );
}

export default ViewBadge;
