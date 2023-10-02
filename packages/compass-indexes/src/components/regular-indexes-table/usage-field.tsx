import React from 'react';
import { Tooltip, Body } from '@mongodb-js/compass-components';

const NO_USAGE_STATS =
  'Either the server does not support the $indexStats command' +
  ' or the user is not authorized to execute it.';

export const getUsageTooltip = (usage?: number): string => {
  return usage === null || usage === undefined
    ? NO_USAGE_STATS
    : `${usage} index hits since index creation or last server restart`;
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
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <Body>
            {usage === null || usage === undefined ? (
              'Usage data unavailable'
            ) : (
              <>
                {usage}
                {nbsp}
                {since ? `(since ${since.toDateString()})` : ''}
              </>
            )}
          </Body>
        </span>
      )}
    >
      <Body>{getUsageTooltip(usage)}</Body>
    </Tooltip>
  );
};

export default UsageField;
