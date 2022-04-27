import React from 'react';
import {
  Badge,
  BadgeVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';

const collectionHeaderBadgeStyles = css({
  marginLeft: spacing[2],
});

const FLEBadge = (): React.ReactElement => (
  <Badge
    data-testid="collection-badge-fle"
    className={collectionHeaderBadgeStyles}
    variant={BadgeVariant.DarkGray}
  >
    FLE2
  </Badge>
);

export default FLEBadge;
