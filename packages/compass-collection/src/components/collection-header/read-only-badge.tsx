import {
  Badge,
  BadgeVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderBadgeStyles = css({
  marginLeft: spacing[2],
  whiteSpace: 'nowrap',
});

const ReadOnlyBadge = (): React.ReactElement => (
  <Badge
    data-testid="collection-badge-readonly"
    className={collectionHeaderBadgeStyles}
    variant={BadgeVariant.LightGray}
  >
    READ-ONLY
  </Badge>
);

export default ReadOnlyBadge;
