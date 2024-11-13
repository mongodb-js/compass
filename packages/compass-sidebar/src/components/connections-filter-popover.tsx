import React, { useCallback, type PropsWithChildren } from 'react';

import {
  css,
  Icon,
  IconButton,
  InteractivePopover,
  Label,
  Overline,
  spacing,
  Toggle,
  Tooltip,
  useId,
} from '@mongodb-js/compass-components';
import type { ConnectionsFilter } from './use-filtered-connections';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: spacing[300],
  minWidth: 270,
});

const closeButtonStyles = css({
  display: 'none',
});

const groupStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[200],
  marginTop: spacing[200],
});

type ConnectionsFilterPopoverProps = PropsWithChildren<{
  open: boolean;
  setOpen: (open: boolean) => void;
  filter: ConnectionsFilter;
  onFilterChange(
    updater: (filter: ConnectionsFilter) => ConnectionsFilter
  ): void;
}>;

export default function ConnectionsFilterPopover({
  open,
  setOpen,
  filter,
  onFilterChange,
}: ConnectionsFilterPopoverProps) {
  const onExcludeInactiveChange = useCallback(
    (excludeInactive: boolean) => {
      onFilterChange((filter) => ({
        ...filter,
        excludeInactive,
      }));
    },
    [onFilterChange]
  );

  const excludeInactiveId = useId('Sort by');

  return (
    <InteractivePopover
      open={open}
      setOpen={setOpen}
      closeButtonClassName={closeButtonStyles}
      containerClassName={containerStyles}
      trigger={({ onClick, children, ref }) => (
        <>
          <Tooltip
            align="right"
            enabled={!open}
            trigger={
              <IconButton
                onClick={onClick}
                active={open}
                aria-label="Filter connections"
                ref={ref as React.Ref<unknown>}
              >
                {/* TODO: Show a small blue circle when filter.excludeInactive is enabled */}
                <Icon glyph="Filter" />
              </IconButton>
            }
          >
            Filter connections
          </Tooltip>
          {children}
        </>
      )}
    >
      <Overline>Filter Options</Overline>
      <div className={groupStyles}>
        <Toggle
          aria-labelledby={excludeInactiveId}
          checked={filter.excludeInactive}
          onChange={onExcludeInactiveChange}
          size="small"
        />
        <Label htmlFor={excludeInactiveId}>Show only active connections</Label>
      </div>
    </InteractivePopover>
  );
}
