import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';

import {
  spacing,
  css,
  Tooltip,
  Body,
  Badge,
  BadgeVariant,
  withTheme,
} from '@mongodb-js/compass-components';
import type { IndexDefinition } from '../../modules/indexes';
import BadgeWithIconLink from './badge-with-icon-link';

const containerStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[3] * 7,
});

const partialTooltip = (partialFilterExpression: JSON) => {
  return `partialFilterExpression: ${JSON.stringify(partialFilterExpression)}`;
};

const ttlTooltip = (expireAfterSeconds: number) => {
  return `expireAfterSeconds: ${expireAfterSeconds}`;
};

export const getPropertyTooltip = (
  property: IndexDefinition['properties'][0],
  extra: IndexDefinition['extra']
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

const ErrorBadgeWithTooltip: React.FunctionComponent<{
  tooltip?: string | null;
  darkMode?: boolean;
}> = ({ tooltip, darkMode }) => {
  return (
    <Tooltip
      darkMode={darkMode}
      delay={500}
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <Badge variant={BadgeVariant.Red}>Failed</Badge>
        </span>
      )}
    >
      <Body>{tooltip}</Body>
    </Tooltip>
  );
};

type PropertyFieldProps = {
  darkMode?: boolean;
  extra: IndexDefinition['extra'];
  properties: IndexDefinition['properties'];
  cardinality: IndexDefinition['cardinality'];
};

const PropertyField: React.FunctionComponent<PropertyFieldProps> = ({
  darkMode,
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
            link={getIndexHelpLink(property.toUpperCase() as any) ?? '#'}
            tooltip={getPropertyTooltip(property, extra)}
          />
        );
      })}
      {cardinality === 'compound' && (
        <PropertyBadgeWithTooltip
          text={cardinality}
          link={getIndexHelpLink(cardinality.toUpperCase() as any) ?? '#'}
        />
      )}
      {extra.status === 'inprogress' && (
        <Badge variant={BadgeVariant.Blue}>In Progress...</Badge>
      )}
      {extra.status === 'failed' && (
        <ErrorBadgeWithTooltip
          tooltip={String(extra.error)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default withTheme(PropertyField);
