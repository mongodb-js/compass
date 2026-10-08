import {
  Badge,
  BadgeVariant,
  Icon,
  css,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderBadgeStyles = css({
  whiteSpace: 'nowrap',
});

export type CollectionBadgeType =
  'readonly' | 'timeseries' | 'view' | 'fle' | 'clustered';

const getBadges = (
  t: TranslateFn
): Readonly<
  Record<
    CollectionBadgeType,
    { label: React.ReactNode; variant?: BadgeVariant }
  >
> => ({
  readonly: {
    label: t('collection.badges.readOnly', 'READ-ONLY'),
    variant: BadgeVariant.LightGray,
  },
  timeseries: {
    label: (
      <>
        <Icon
          glyph="TimeSeries"
          title={t(
            'collection.badges.timeSeriesCollection',
            'Time-Series Collection'
          )}
        />
        &nbsp;{t('collection.badges.timeSeries', 'TIME-SERIES')}
      </>
    ),
  },
  view: {
    label: (
      <>
        <Icon
          glyph="Visibility"
          title={t('collection.badges.viewTitle', 'View')}
        />
        &nbsp;{t('collection.badges.view', 'VIEW')}
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
    label: t('collection.badges.clustered', 'CLUSTERED'),
  },
});

export const CollectionBadge = ({ type }: { type: CollectionBadgeType }) => {
  const t = useTranslation();
  const { label, variant } = getBadges(t)[type];
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
