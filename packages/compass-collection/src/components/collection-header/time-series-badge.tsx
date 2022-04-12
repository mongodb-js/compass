import {
  Badge,
  BadgeVariant,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderBadgeStyles = css({
  marginLeft: spacing[2],
  whiteSpace: 'nowrap',
});

const TimeSeriesBadge = (): React.ReactElement => (
  <Badge
    data-testid="collection-badge-timeseries"
    className={collectionHeaderBadgeStyles}
    variant={BadgeVariant.DarkGray}
  >
    <Icon glyph="TimeSeries" title="Time-Series Collection" />
    &nbsp;TIME-SERIES
  </Badge>
);

export default TimeSeriesBadge;
