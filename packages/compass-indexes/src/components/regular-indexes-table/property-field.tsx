import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';

import {
  spacing,
  css,
  Tooltip,
  Body,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import type { RegularIndex } from '../../modules/regular-indexes';
import BadgeWithIconLink from '../indexes-table/badge-with-icon-link';

const containerStyles = css({
  display: 'flex',
  gap: spacing[100],
  minWidth: spacing[400] * 7,
  alignItems: 'baseline',
});

const partialTooltip = (partialFilterExpression: unknown) => {
  return `partialFilterExpression: ${JSON.stringify(partialFilterExpression)}`;
};

const ttlTooltip = (expireAfterSeconds: string) => {
  return `expireAfterSeconds: ${expireAfterSeconds}`;
};

export const getPropertyTooltip = (
  property: string,
  extra: RegularIndex['extra']
): string | null => {
  if (property === 'ttl' && extra.expireAfterSeconds !== undefined) {
    return ttlTooltip(extra.expireAfterSeconds as unknown as string);
  }

  if (property === 'partial' && extra.partialFilterExpression !== undefined) {
    return partialTooltip(extra.partialFilterExpression);
  }

  return null;
};

const HIDDEN_INDEX_TEXT = 'HIDDEN';
const SHARD_KEY_INDEX_TEXT = 'SHARD KEY';

export const getPropertyText = (
  property: RegularIndex['properties'][number],
  t?: TranslateFn
): string => {
  if (property === 'shardKey') {
    return (
      t?.('indexes.propertyField.shardKey', SHARD_KEY_INDEX_TEXT) ??
      SHARD_KEY_INDEX_TEXT
    );
  }

  return t ? translatePropertyName(property, t) : property;
};

const translatePropertyName = (property: string, t: TranslateFn): string => {
  switch (property) {
    case 'unique':
      return t('indexes.propertyField.unique', 'unique');
    case 'sparse':
      return t('indexes.propertyField.sparse', 'sparse');
    case 'partial':
      return t('indexes.propertyField.partial', 'partial');
    case 'collation':
      return t('indexes.propertyField.collation', 'collation');
    default:
      return property;
  }
};

const PropertyBadgeWithTooltip: React.FunctionComponent<{
  text: string;
  link: string;
  tooltip?: string | null;
}> = ({ text, link, tooltip }) => {
  return (
    <Tooltip
      enabled={!!tooltip}
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLDivElement>) => (
        <div {...tooltipTriggerProps}>
          <BadgeWithIconLink link={link} text={text} />
          {tooltipChildren}
        </div>
      )}
      triggerEvent="hover"
    >
      <Body>{tooltip}</Body>
    </Tooltip>
  );
};

type PropertyFieldProps = {
  cardinality?: RegularIndex['cardinality'];
  extra?: RegularIndex['extra'];
  properties: RegularIndex['properties'];
};

const PropertyField: React.FunctionComponent<PropertyFieldProps> = ({
  extra,
  properties,
  cardinality,
}) => {
  const t = useTranslation();
  return (
    <div className={containerStyles}>
      {extra &&
        properties?.map((property) => {
          return (
            <PropertyBadgeWithTooltip
              key={property}
              text={getPropertyText(property, t)}
              link={getIndexHelpLink(property) ?? '#'}
              tooltip={getPropertyTooltip(property, extra)}
            />
          );
        })}
      {cardinality === 'compound' && (
        <PropertyBadgeWithTooltip
          text={t('indexes.propertyField.compound', cardinality)}
          link={getIndexHelpLink(cardinality) ?? '#'}
        />
      )}
      {extra?.hidden && (
        <PropertyBadgeWithTooltip
          text={t('indexes.propertyField.hidden', HIDDEN_INDEX_TEXT)}
          link={getIndexHelpLink(HIDDEN_INDEX_TEXT) ?? '#'}
        />
      )}
    </div>
  );
};

export default PropertyField;
