import React from 'react';
import {
  Badge,
  BadgeVariant,
  css,
  spacing,
  Icon,
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
    {/* TODO(COMPASS-5626): use proper name instead of FLE2 */}
    <Icon glyph="Key" title="FLE2" size="small" />
    &nbsp;FLE2
  </Badge>
);

export default FLEBadge;
