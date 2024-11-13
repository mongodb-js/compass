import React, { useCallback, useState } from 'react';
import { css, spacing, TextInput } from '@mongodb-js/compass-components';
import type { ConnectionsFilter } from './use-filtered-connections';
import ConnectionsFilterPopover from './connections-filter-popover';

const filterContainerStyles = css({
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

function createRegExp(input: string) {
  try {
    return input ? new RegExp(input, 'i') : null;
  } catch (e) {
    return null;
  }
}

export default function NavigationItemsFilter({
  placeholder = 'Search',
  ariaLabel = 'Search',
  title = 'Search',
  filter,
  onFilterChange,
}: {
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  filter: ConnectionsFilter;
  onFilterChange(
    updater: (filter: ConnectionsFilter) => ConnectionsFilter
  ): void;
}): React.ReactElement {
  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onFilterChange((filter) => ({
        ...filter,
        regex: createRegExp(event.target.value),
      }));
    },
    [onFilterChange]
  );

  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const onSubmit = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  return (
    <form noValidate className={filterContainerStyles} onSubmit={onSubmit}>
      <TextInput
        data-testid="sidebar-filter-input"
        placeholder={placeholder}
        type="search"
        aria-label={ariaLabel}
        title={title}
        onChange={onChange}
        className={textInputStyles}
      />
      <ConnectionsFilterPopover
        open={isPopoverOpen}
        setOpen={setPopoverOpen}
        filter={filter}
        onFilterChange={onFilterChange}
      />
    </form>
  );
}
