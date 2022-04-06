import { Badge, BadgeVariant, css } from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderBadgeStyles = css({
  marginLeft: '8px',
});

const ReadOnlyBadge = (): React.ReactElement => (
  <Badge
    data-testid="collection-badge-readonly"
    className={collectionHeaderBadgeStyles}
    variant={BadgeVariant.LightGray}
  >READ-ONLY</Badge>
);

export default ReadOnlyBadge;
