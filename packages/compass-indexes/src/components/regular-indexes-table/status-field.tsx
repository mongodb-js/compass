import React from 'react';

import {
  spacing,
  css,
  Tooltip,
  Body,
  Badge,
  BadgeVariant,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { InProgressIndex } from '../../modules/regular-indexes';

const statusFieldStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[3] * 7,
  alignItems: 'baseline',
});

const iconBadgeStyles = css({
  gap: spacing[200],
});

const ErrorBadgeWithTooltip: React.FunctionComponent<{
  ['data-testid']?: string;
  text: string;
  tooltip?: string | null;
  darkMode?: boolean;
}> = ({ ['data-testid']: dataTestId, text, tooltip, darkMode }) => {
  return (
    <Tooltip
      enabled={!!tooltip}
      darkMode={darkMode}
      trigger={
        <Badge data-testid={dataTestId} variant={BadgeVariant.Red}>
          {text}
        </Badge>
      }
    >
      <Body>{tooltip}</Body>
    </Tooltip>
  );
};

type StatusFieldProps = {
  status: InProgressIndex['status'] | 'ready' | 'building';
  error?: InProgressIndex['error'];
};

const StatusField: React.FunctionComponent<StatusFieldProps> = ({
  status,
  error,
}) => {
  const darkMode = useDarkMode();

  return (
    <div className={statusFieldStyles}>
      {status === 'ready' && (
        <Badge data-testid="index-ready" variant={BadgeVariant.Green}>
          Ready
        </Badge>
      )}

      {status === 'building' && (
        <Badge
          data-testid="index-building"
          variant={BadgeVariant.Blue}
          className={iconBadgeStyles}
        >
          Building
        </Badge>
      )}

      {status === 'inprogress' && (
        <Badge data-testid="index-in-progress" variant={BadgeVariant.Blue}>
          In Progress
        </Badge>
      )}

      {status === 'failed' && (
        <ErrorBadgeWithTooltip
          data-testid="index-failed"
          text="Failed"
          tooltip={error ? error : ''}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default StatusField;
