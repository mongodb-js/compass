import React from 'react';
import { Badge, BadgeVariant, css } from '@mongodb-js/compass-components';

const collectionHeaderBadgeStyles = css({
  marginLeft: spacing[2],
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
