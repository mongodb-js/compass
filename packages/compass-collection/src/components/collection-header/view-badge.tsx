import { Badge, BadgeVariant, Icon, css } from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderBadgeStyles = css({
  marginLeft: '8px',
});

const ViewBadge = (): React.ReactElement => (
  <Badge
    data-testid="collection-badge-view"
    className={collectionHeaderBadgeStyles}
    variant={BadgeVariant.DarkGray}
  >
    <Icon
      glyph="Visibility"
      title="View"
    />&nbsp;VIEW
  </Badge>
);

export default ViewBadge;
