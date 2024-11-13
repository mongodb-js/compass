import React, { useCallback } from 'react';
import {
  ConnectedPlugsIcon,
  css,
  DisconnectedPlugIcon,
  IconButton,
  spacing,
  TextInput,
  Tooltip,
} from '@mongodb-js/compass-components';
import type { ConnectionsFilter } from './use-filtered-connections';

const filterContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[200],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
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
  className,
}: {
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  filter: ConnectionsFilter;
  onFilterChange(
    updater: (filter: ConnectionsFilter) => ConnectionsFilter
  ): void;
  className?: string;
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

  const toggleExcludeInactive = useCallback(() => {
    onFilterChange((filter) => ({
      ...filter,
      excludeInactive: !filter.excludeInactive,
    }));
  }, [onFilterChange]);

  const onSubmit = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  return (
    <div className={filterContainerStyles}>
      <form noValidate className={className} onSubmit={onSubmit}>
        <TextInput
          data-testid="sidebar-filter-input"
          placeholder={placeholder}
          type="search"
          aria-label={ariaLabel}
          title={title}
          onChange={onChange}
        />
      </form>
      <Tooltip
        justify="middle"
        trigger={
          <IconButton
            onClick={toggleExcludeInactive}
            active={filter.excludeInactive}
            aria-label={
              filter.excludeInactive
                ? 'Showing active connections'
                : 'Showing all connections'
            }
          >
            {filter.excludeInactive ? (
              <ConnectedPlugsIcon />
            ) : (
              <DisconnectedPlugIcon />
            )}
          </IconButton>
        }
      >
        {filter.excludeInactive
          ? 'Showing active connections'
          : 'Showing all connections'}
      </Tooltip>
    </div>
  );
}
