import { Badge, BadgeVariant, Icon, css } from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderBadgeStyles = css({
  whiteSpace: 'nowrap',
});

export type CollectionBadgeType =
  | 'readonly'
  | 'timeseries'
  | 'view'
  | 'fle'
  | 'clustered';

const badges: Record<
  CollectionBadgeType,
  { label: React.ReactNode; variant?: BadgeVariant }
> = {
  readonly: {
    label: 'READ-ONLY',
    variant: BadgeVariant.LightGray,
  },
  timeseries: {
    label: (
      <>
        <Icon glyph="TimeSeries" title="Time-Series Collection" />
        &nbsp;TIME-SERIES
      </>
    ),
  },
  view: {
    label: (
      <>
        <Icon glyph="Visibility" title="View" />
        &nbsp;VIEW
      </>
    ),
  },
  fle: {
    label: (
      <>
        {/* Queryable Encryption is the user-facing name of FLE2 */}
        <Icon glyph="Key" title="Queryable Encryption" size="small" />
        &nbsp;Queryable Encryption
      </>
    ),
  },
  clustered: {
    label: 'CLUSTERED',
  },
};

export const CollectionBadge = ({ type }: { type: CollectionBadgeType }) => {
  const { label, variant } = badges[type];
  return (
    <Badge
      data-testid={`collection-badge-${type}`}
      className={collectionHeaderBadgeStyles}
      variant={variant ?? BadgeVariant.DarkGray}
    >
      {label}
    </Badge>
  );
};
