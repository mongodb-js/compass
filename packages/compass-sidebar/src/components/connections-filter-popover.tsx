import React, { useCallback, useState, type PropsWithChildren } from 'react';

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

  const excludeInactiveToggleId = useId();
  const excludeInactiveLabelId = useId();

  // Add future filters to the boolean below
  const isActivated = filter.excludeInactive;

  // Manually handling the tooltip state instead of supplying a trigger
  // we do this to avoid the tooltip from rendering when the popover is open
  // and when the IconButton regains focus as the popover is closed.
  const [isTooltipOpen, setTooltipOpen] = useState(false);
  const handleButtonMouseEnter = useCallback(
    () => setTooltipOpen(true),
    [setTooltipOpen]
  );
  const handleButtonMouseLeave = useCallback(
    () => setTooltipOpen(false),
    [setTooltipOpen]
  );

  return (
    <>
      <Tooltip
        align="right"
        open={isTooltipOpen && !open}
        setOpen={setTooltipOpen}
      >
        Filter connections
      </Tooltip>
      <InteractivePopover
        open={open}
        setOpen={setOpen}
        containerClassName={containerStyles}
        hideCloseButton
        trigger={({ onClick, children, ref }) => (
          <>
            <IconButton
              onClick={onClick}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              active={open}
              aria-label="Filter connections"
              ref={ref as React.Ref<unknown>}
            >
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
            {children}
          </>
        )}
      >
        <Overline>Filter Options</Overline>
        <div className={groupStyles}>
          <Toggle
            id={excludeInactiveToggleId}
            aria-labelledby={excludeInactiveLabelId}
            checked={filter.excludeInactive}
            onChange={onExcludeInactiveChange}
            size="small"
          />
          <Label htmlFor={excludeInactiveToggleId} id={excludeInactiveLabelId}>
            Show only active connections
          </Label>
        </div>
      </InteractivePopover>
    </>
  );
}
