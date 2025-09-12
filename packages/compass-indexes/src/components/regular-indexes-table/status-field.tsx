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
  status: InProgressIndex['status'] | 'ready' | 'building' | 'inprogress';
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
        <BadgeWithTooltip
          data-testid="index-building"
          variant={BadgeVariant.Blue}
          tooltip="This index is being built in a rolling process"
        >
          Building
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
    </div>
  );
};

export default StatusField;
