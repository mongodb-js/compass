import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';

import { spacing, css, Tooltip, Body } from '@mongodb-js/compass-components';
import type { IndexModel } from './indexes-table';
import BadgeWithIconLink from './badge-with-icon-link';

const containerStyles = css({
  display: 'flex',
  gap: spacing[1],
});

const partialTooltip = (partialFilterExpression: JSON) => {
  return `partialFilterExpression: ${JSON.stringify(partialFilterExpression)}`;
};

const ttlTooltip = (expireAfterSeconds: number) => {
  return `expireAfterSeconds: ${expireAfterSeconds}`;
};

export const getPropertyTooltip = (
  property: IndexModel['properties'][0],
  extra: IndexModel['extra']
): string | null => {
  return property === 'ttl'
    ? ttlTooltip(extra.expireAfterSeconds as number)
    : property === 'partial'
    ? partialTooltip(extra.partialFilterExpression as JSON)
    : null;
};

const PropertyBadgeWithTooltip: React.FunctionComponent<{
  text: string;
  link: string;
  tooltip?: string | null;
}> = ({ text, link, tooltip }) => {
  return (
    <Tooltip
      enabled={!!tooltip}
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <BadgeWithIconLink link={link} text={text} />
        </span>
      )}
    >
      <Body>{tooltip}</Body>
    </Tooltip>
  );
};

type PropertyFieldProps = {
  extra: IndexModel['extra'];
  properties: IndexModel['properties'];
  cardinality: IndexModel['cardinality'];
};

const PropertyField: React.FunctionComponent<PropertyFieldProps> = ({
  extra,
  properties,
  cardinality,
}) => {
  return (
    <div className={containerStyles}>
      {properties.map((property) => {
        return (
          <PropertyBadgeWithTooltip
            key={property}
            text={property}
            // todo: align index types across
            link={getIndexHelpLink(property.toUpperCase() as any) ?? '#'}
            tooltip={getPropertyTooltip(property, extra)}
          />
        );
      })}
      {cardinality === 'compound' && (
        <PropertyBadgeWithTooltip
          text={cardinality}
          // todo: align index types across
          link={getIndexHelpLink(cardinality.toUpperCase() as any) ?? '#'}
        />
      )}
    </div>
  );
};

export default PropertyField;
