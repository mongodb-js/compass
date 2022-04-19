import React from 'react';
import { Badge, BadgeVariant, css } from '@mongodb-js/compass-components';

const collectionHeaderBadgeStyles = css({
  marginLeft: '8px',
});

const ClusteredBadge = (): React.ReactElement => (
  <Badge
    data-testid="collection-badge-clustered"
    className={collectionHeaderBadgeStyles}
    variant={BadgeVariant.DarkGray}
  >
    CLUSTERED
  </Badge>
);

export default ClusteredBadge;
