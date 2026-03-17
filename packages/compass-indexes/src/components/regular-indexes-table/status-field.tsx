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
  gap: spacing[100],
  minWidth: spacing[400] * 7,
  alignItems: 'baseline',
});

const BadgeWithTooltip: React.FunctionComponent<{
  ['data-testid']?: string;
  tooltip?: string | null;
  darkMode?: boolean;
  variant?: BadgeVariant;
  children: React.ReactNode;
}> = ({
  ['data-testid']: dataTestId,
  children,
  tooltip,
  darkMode,
  variant,
}) => {
  return (
    <Tooltip
      enabled={!!tooltip}
      darkMode={darkMode}
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLDivElement>) => (
        <div {...tooltipTriggerProps}>
          <Badge data-testid={dataTestId} variant={variant}>
            {children}
          </Badge>
          {tooltipChildren}
        </div>
      )}
    >
      <Body>{tooltip}</Body>
    </Tooltip>
  );
};

type StatusFieldProps = {
  status:
    | InProgressIndex['status']
    | 'ready'
    | 'building'
    | 'inprogress'
    | 'unknown';
  error?: InProgressIndex['error'];
  /** Optional tooltip to show on the status badge (used when detailed progress unavailable) */
  tooltip?: string;
};

const StatusField: React.FunctionComponent<StatusFieldProps> = ({
  status,
  error,
  tooltip,
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
        <BadgeWithTooltip
          data-testid="index-building"
          variant={BadgeVariant.Blue}
          tooltip="This index is being built in a rolling process"
        >
          Building
        </BadgeWithTooltip>
      )}

      {status === 'inprogress' && (
        <BadgeWithTooltip
          data-testid="index-in-progress"
          variant={BadgeVariant.Blue}
          tooltip={tooltip}
          darkMode={darkMode}
        >
          In Progress
        </BadgeWithTooltip>
      )}

      {status === 'creating' && (
        <Badge data-testid="index-creating" variant={BadgeVariant.Blue}>
          Creating
        </Badge>
      )}

      {status === 'failed' && (
        <BadgeWithTooltip
          data-testid="index-failed"
          tooltip={error ? error : ''}
          darkMode={darkMode}
          variant={BadgeVariant.Red}
        >
          Failed
        </BadgeWithTooltip>
      )}

      {status === 'unknown' && (
        <BadgeWithTooltip
          data-testid="index-unknown"
          tooltip={
            tooltip || 'Build status unavailable (insufficient permissions)'
          }
          darkMode={darkMode}
          variant={BadgeVariant.Yellow}
        >
          Unknown
        </BadgeWithTooltip>
      )}
    </div>
  );
};

export default StatusField;
