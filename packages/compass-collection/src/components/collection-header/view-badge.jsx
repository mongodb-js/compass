import React from 'react';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';

import styles from './collection-header.less';

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
