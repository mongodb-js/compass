import React, { useCallback, type PropsWithChildren } from 'react';

import {
  css,
  Icon,
  IconButton,
  InteractivePopover,
  Label,
  Overline,
  palette,
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
  // An alternative to this is to pass hideCloseButton to InteractivePopover,
  // but that throws an error when the popover is opened
  display: 'none',
});

const activatedIndicatorStyles = css({
  position: 'absolute',
  top: spacing[50],
  right: spacing[50],
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

  // Add future filters to the boolean below
  const isActivated = filter.excludeInactive;

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
                {isActivated && (
                  <svg
                    className={activatedIndicatorStyles}
                    width="6"
                    height="6"
                    viewBox="0 0 6 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="3" cy="3" r="3" fill={palette.blue.base} />
                  </svg>
                )}
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
