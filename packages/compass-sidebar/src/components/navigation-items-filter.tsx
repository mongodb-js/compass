import React, { useCallback, useState } from 'react';
import {
  css,
  cx,
  Description,
  Link,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import type { Folder } from '@mongodb-js/connection-storage/provider';
import {
  isConnectionsFilterActive,
  type ConnectionsFilter,
} from './use-filtered-connections';
import ConnectionsFilterPopover from './connections-filter-popover';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  // Matches the connections container's gap, so the caption keeps its spacing
  // whether or not it is rendered.
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

const captionTextStyles = css({
  // Matches the tree labels below it.
  fontSize: '12px',
  lineHeight: '16px',
});

const captionRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const EMPTY_FOLDERS: Folder[] = [];

const NO_FILTER: ConnectionsFilter = {
  regex: null,
  excludeInactive: false,
  hiddenFolderIds: [],
  hideUncategorizedConnections: false,
};

function createRegExp(input: string) {
  try {
    return input ? new RegExp(input, 'i') : null;
  } catch {
    return null;
  }
}

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
  // The filter only holds the compiled regex, so the text the user typed is
  // kept here — it is what the input renders and what Reset has to clear.
  const [searchText, setSearchText] = useState('');

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      setSearchText(event.target.value);
      onFilterChange((filter) => ({
        ...filter,
        regex: createRegExp(event.target.value),
      }));
    },
    [onFilterChange]
  );

  const onReset = useCallback(() => {
    setSearchText('');
    onFilterChange(() => NO_FILTER);
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
          value={searchText}
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
      {isConnectionsFilterActive(filter) && (
        <div className={cx(captionTextStyles, captionRowStyles)}>
          <Description className={captionTextStyles}>
            Filter applied
          </Description>
          <Link as="button" hideExternalIcon onClick={onReset}>
            Reset
          </Link>
        </div>
      )}
    </div>
  );
}
