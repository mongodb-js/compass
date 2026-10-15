import React from 'react';
import { Tooltip, Body } from '@mongodb-js/compass-components';
import { formatUsageSince } from '../../utils/format-usage-since';

const NO_USAGE_STATS =
  'Either the server does not support the $indexStats command' +
  ' or the user is not authorized to execute it.';

export const getUsageTooltip = (usage?: number, since?: Date): string => {
  if (usage === null || usage === undefined) {
    return NO_USAGE_STATS;
  }
  const hits = `${usage} index hits`;
  return since
    ? `${hits} since ${since.toISOString()}`
    : `${hits} since index creation or last server restart`;
};

type UsageFieldProps = {
  usage?: number;
  since?: Date;
};

const nbsp = '\u00a0';
const UsageField: React.FunctionComponent<UsageFieldProps> = ({
  usage,
  since,
}) => {
  return (
    <Tooltip
      trigger={
        <Body>
          {usage === null || usage === undefined ? (
            'Usage data unavailable'
          ) : (
            <>
              {usage}
              {nbsp}
              {since ? `(since ${formatUsageSince(since)})` : ''}
            </>
          )}
        </Body>
      }
    >
      <Body>{getUsageTooltip(usage, since)}</Body>
    </Tooltip>
  );
};

export default UsageField;
