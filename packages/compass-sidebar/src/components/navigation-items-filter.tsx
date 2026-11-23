import React, { useCallback, useState } from 'react';
import {
  css,
  Disclaimer,
  Link,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import type { Folder } from '@mongodb-js/connection-storage/provider';
import {
  areConnectionsFiltersActive,
  INITIAL_CONNECTIONS_FILTER,
  type ConnectionsFilter,
} from './use-filtered-connections';
import ConnectionsFilterPopover from './connections-filter-popover';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  // Matches the connections container's gap, so spacing holds whether or not the caption renders.
  gap: spacing[200],
});

const filterRowStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[200],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const textInputStyles = css({
  flexGrow: 1,
});

const captionRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const EMPTY_FOLDERS: Folder[] = [];

export default function NavigationItemsFilter({
  placeholder = 'Search',
  ariaLabel = 'Search',
  title = 'Search',
  filter,
  onFilterChange,
  folders = EMPTY_FOLDERS,
  disabled = false,
}: {
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  filter: ConnectionsFilter;
  onFilterChange(
    updater: (filter: ConnectionsFilter) => ConnectionsFilter
  ): void;
  folders?: Folder[];
  disabled?: boolean;
}): React.ReactElement {
  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const search = event.target.value;
      onFilterChange((filter) => ({ ...filter, search }));
    },
    [onFilterChange]
  );

  const onReset = useCallback(() => {
    onFilterChange(() => INITIAL_CONNECTIONS_FILTER);
  }, [onFilterChange]);

  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const onSubmit = useCallback((evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  return (
    <div className={containerStyles}>
      <form noValidate className={filterRowStyles} onSubmit={onSubmit}>
        <TextInput
          data-testid="sidebar-filter-input"
          placeholder={placeholder}
          type="search"
          aria-label={ariaLabel}
          title={title}
          value={filter.search}
          onChange={onChange}
          className={textInputStyles}
          disabled={disabled}
        />
        <ConnectionsFilterPopover
          open={isPopoverOpen}
          setOpen={setPopoverOpen}
          filter={filter}
          onFilterChange={onFilterChange}
          folders={folders}
          disabled={disabled}
        />
      </form>
      {areConnectionsFiltersActive(filter) && (
        <div className={captionRowStyles}>
          <Disclaimer>Filter applied</Disclaimer>
          <Link as="button" hideExternalIcon onClick={onReset}>
            Reset
          </Link>
        </div>
      )}
    </div>
  );
}
