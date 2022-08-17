import React from 'react';
import { Tooltip, Body } from '@mongodb-js/compass-components';

const NO_USAGE_STATS =
  'Either the server does not support the $indexStats command' +
  'or the user is not authorized to execute it.';

type UsageFieldProps = {
  usage?: number;
  since?: Date;
};

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
            {usage || 0}&nbsp;(
            <span>
              since&nbsp;
              {since ? since.toDateString() : 'N/A'}
            </span>
            )
          </Body>
        </span>
      )}
    >
      <Body>
        {!usage
          ? NO_USAGE_STATS
          : `${usage} index hits since index creation or last server restart`}
      </Body>
    </Tooltip>
  );
};

export default UsageField;
