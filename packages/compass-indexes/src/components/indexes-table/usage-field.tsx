import React from 'react';
import { Tooltip, Body } from '@mongodb-js/compass-components';

const NO_USAGE_STATS =
  'Either the server does not support the $indexStats command' +
  'or the user is not authorized to execute it.';

export const getUsageTooltip = (usage?: number): string => {
  return !usage
    ? NO_USAGE_STATS
    : `${usage} index hits since index creation or last server restart`;
};

type UsageFieldProps = {
  darkMode?: boolean;
  usage?: number;
  since?: Date;
};

const nbsp = '\u00a0';
const UsageField: React.FunctionComponent<UsageFieldProps> = ({
  darkMode,
  usage,
  since,
}) => {
  return (
    <Tooltip
      darkMode={darkMode}
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <Body>
            {usage || 0}
            {nbsp}(<>{since ? `since ${since.toDateString()}` : 'N/A'}</>)
          </Body>
        </span>
      )}
    >
      <Body>{getUsageTooltip(usage)}</Body>
    </Tooltip>
  );
};

export default UsageField;
