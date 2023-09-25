import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';

import {
  spacing,
  css,
  Tooltip,
  Body,
  Badge,
  BadgeVariant,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { RegularIndex } from '../../modules/regular-indexes';
import BadgeWithIconLink from './badge-with-icon-link';

const containerStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[3] * 7,
  alignItems: 'baseline',
});

const partialTooltip = (partialFilterExpression: unknown) => {
  return `partialFilterExpression: ${JSON.stringify(partialFilterExpression)}`;
};

const ttlTooltip = (expireAfterSeconds: number) => {
  return `expireAfterSeconds: ${expireAfterSeconds}`;
};

export const getPropertyTooltip = (
  property: string | undefined,
  extra: RegularIndex['extra']
): string | null => {
  return property === 'ttl'
    ? ttlTooltip(extra.expireAfterSeconds as number)
    : property === 'partial'
    ? partialTooltip(extra.partialFilterExpression)
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
      enabled={!!tooltip}
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
  extra: RegularIndex['extra'];
  properties: RegularIndex['properties'];
  cardinality: RegularIndex['cardinality'];
};

const HIDDEN_INDEX_TEXT = 'HIDDEN';

const PropertyField: React.FunctionComponent<PropertyFieldProps> = ({
  extra,
  properties,
  cardinality,
}) => {
  const darkMode = useDarkMode();

  return (
    <div className={containerStyles}>
      {properties?.map((property) => {
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
      {extra.hidden && (
        <PropertyBadgeWithTooltip
          text={HIDDEN_INDEX_TEXT}
          link={getIndexHelpLink(HIDDEN_INDEX_TEXT) ?? '#'}
        />
      )}
      {extra.status === 'inprogress' && (
        <Badge variant={BadgeVariant.Blue}>In Progress ...</Badge>
      )}
      {extra.status === 'failed' && (
        <ErrorBadgeWithTooltip
          tooltip={extra.error ? String(extra.error) : ''}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default PropertyField;
