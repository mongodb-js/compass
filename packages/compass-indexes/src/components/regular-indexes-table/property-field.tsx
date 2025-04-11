import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';

import { spacing, css, Tooltip, Body } from '@mongodb-js/compass-components';
import type { RegularIndex } from '../../modules/regular-indexes';
import BadgeWithIconLink from '../indexes-table/badge-with-icon-link';

const containerStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[3] * 7,
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

const HIDDEN_INDEX_TEXT = 'HIDDEN';

const PropertyField: React.FunctionComponent<PropertyFieldProps> = ({
  extra,
  properties,
  cardinality,
}) => {
  return (
    <div className={containerStyles}>
      {extra &&
        properties?.map((property) => {
          return (
            <PropertyBadgeWithTooltip
              key={property}
              text={property}
              link={getIndexHelpLink(property) ?? '#'}
              tooltip={getPropertyTooltip(property, extra)}
            />
          );
        })}
      {cardinality === 'compound' && (
        <PropertyBadgeWithTooltip
          text={cardinality}
          link={getIndexHelpLink(cardinality) ?? '#'}
        />
      )}
      {extra?.hidden && (
        <PropertyBadgeWithTooltip
          text={HIDDEN_INDEX_TEXT}
          link={getIndexHelpLink(HIDDEN_INDEX_TEXT) ?? '#'}
        />
      )}
    </div>
  );
};

export default PropertyField;
