import { Badge, BadgeVariant, Icon, css } from '@mongodb-js/compass-components';
import React from 'react';
import { useTranslation } from 'react-i18next';

const collectionHeaderBadgeStyles = css({
  whiteSpace: 'nowrap',
});

export type CollectionBadgeType =
  | 'readonly'
  | 'timeseries'
  | 'view'
  | 'fle'
  | 'clustered';

export const CollectionBadge = ({ type }: { type: CollectionBadgeType }) => {
  const { t } = useTranslation('compassCollection');

  const badges: Readonly<
    Record<
      CollectionBadgeType,
      { label: React.ReactNode; variant?: BadgeVariant }
    >
  > = {
    readonly: {
      label: t('badgeReadOnly'),
      variant: BadgeVariant.LightGray,
    },
    timeseries: {
      label: (
        <>
          <Icon glyph="TimeSeries" title={t('badgeTimeSeriesIconTitle')} />
          &nbsp;{t('badgeTimeSeriesLabel')}
        </>
      ),
    },
    view: {
      label: (
        <>
          <Icon glyph="Visibility" title={t('badgeViewIconTitle')} />
          &nbsp;{t('badgeViewLabel')}
        </>
      ),
    },
    fle: {
      label: (
        <>
          {/* Queryable Encryption is the user-facing name of FLE2 */}
          <Icon
            glyph="Key"
            title={t('badgeQueryableEncryptionIconTitle')}
            size="small"
          />
          &nbsp;{t('badgeQueryableEncryptionLabel')}
        </>
      ),
    },
    clustered: {
      label: t('badgeClustered'),
    },
  };

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
