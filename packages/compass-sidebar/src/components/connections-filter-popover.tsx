import React, {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

import {
  Checkbox,
  css,
  HorizontalRule,
  Icon,
  IconButton,
  InteractivePopover,
  Overline,
  palette,
  spacing,
  Tooltip,
  useId,
} from '@mongodb-js/compass-components';
import type { Folder } from '@mongodb-js/connection-storage/provider';
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

const dividerStyles = css({
  width: '100%',
  marginTop: spacing[200],
  marginBottom: spacing[200],
});

const folderListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  maxHeight: '40vh',
  overflow: 'auto',
  // Stretch to the popover width so the scrollbar sits on the far right
  // instead of hugging the labels.
  alignSelf: 'stretch',
});

// Folders and uncategorized are nested under "All connections", so they read
// as its subcategories.
const folderItemStyles = css({
  paddingLeft: spacing[600],
});

const EMPTY_FOLDERS: Folder[] = [];
const EMPTY_HIDDEN_FOLDER_IDS: string[] = [];

// Stands in for "connections not filed in any folder" in the folders list, so
// uncategorized connections can be shown or hidden alongside real folders.
const UNCATEGORIZED_ITEM_ID = 'uncategorized';

type FolderFilterItem = {
  id: string;
  name: string;
  selected: boolean;
};

type ConnectionsFilterPopoverProps = PropsWithChildren<{
  open: boolean;
  setOpen: (open: boolean) => void;
  filter: ConnectionsFilter;
  onFilterChange(
    updater: (filter: ConnectionsFilter) => ConnectionsFilter
  ): void;
  folders?: Folder[];
  disabled?: boolean;
}>;

export default function ConnectionsFilterPopover({
  open,
  setOpen,
  filter,
  onFilterChange,
  folders = EMPTY_FOLDERS,
  disabled = false,
}: ConnectionsFilterPopoverProps) {
  const track = useTelemetry();
  const onExcludeInactiveChange = useCallback(
    (excludeInactive: boolean) => {
      onFilterChange((filter) => ({
        ...filter,
        excludeInactive,
      }));
      track('Sidebar Connections Active Connections Filter Toggled', {
        active_only: excludeInactive,
      });
    },
    [onFilterChange, track]
  );

  const excludeInactiveCheckboxId = useId();
  const allConnectionsCheckboxId = useId();

  const hiddenFolderIds = filter.hiddenFolderIds ?? EMPTY_HIDDEN_FOLDER_IDS;
  const hideUncategorizedConnections = !!filter.hideUncategorizedConnections;

  // The folders are listed in the same order as the tree, so the popover and
  // the sidebar read the same way.
  const folderItems = useMemo((): FolderFilterItem[] => {
    const sortedFolders = folders
      .slice()
      .sort((a, b) =>
        a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
      );
    return [
      ...sortedFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        selected: !hiddenFolderIds.includes(folder.id),
      })),
      {
        id: UNCATEGORIZED_ITEM_ID,
        name: 'Uncategorized',
        selected: !hideUncategorizedConnections,
      },
    ];
  }, [folders, hiddenFolderIds, hideUncategorizedConnections]);

  const allItemsSelected = folderItems.every((item) => item.selected);
  const someItemsSelected = folderItems.some((item) => item.selected);

  const onToggleAllItems = useCallback(
    (checked: boolean) => {
      onFilterChange((filter) => ({
        ...filter,
        hiddenFolderIds: checked ? [] : folders.map((folder) => folder.id),
        hideUncategorizedConnections: !checked,
      }));
    },
    [folders, onFilterChange]
  );

  const onToggleItem = useCallback(
    (itemId: string, checked: boolean) => {
      if (itemId === UNCATEGORIZED_ITEM_ID) {
        onFilterChange((filter) => ({
          ...filter,
          hideUncategorizedConnections: !checked,
        }));
        return;
      }
      onFilterChange((filter) => {
        const hidden = filter.hiddenFolderIds ?? EMPTY_HIDDEN_FOLDER_IDS;
        return {
          ...filter,
          hiddenFolderIds: checked
            ? hidden.filter((folderId) => folderId !== itemId)
            : [...hidden, itemId],
        };
      });
    },
    [onFilterChange]
  );

  // Add future filters to the boolean below
  const isActivated =
    filter.excludeInactive ||
    hiddenFolderIds.length > 0 ||
    hideUncategorizedConnections;

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
      <InteractivePopover<HTMLButtonElement>
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
              ref={ref}
              disabled={disabled}
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
        <Overline>Filters</Overline>
        <Checkbox
          id={excludeInactiveCheckboxId}
          checked={filter.excludeInactive}
          onChange={(evt) => onExcludeInactiveChange(evt.target.checked)}
          label="Show only active connections"
          disabled={disabled}
        />
        {folders.length > 0 && (
          <>
            <HorizontalRule className={dividerStyles} />
            <div className={folderListStyles}>
              <Checkbox
                data-testid="folder-filter-all"
                id={allConnectionsCheckboxId}
                checked={allItemsSelected}
                indeterminate={!allItemsSelected && someItemsSelected}
                onChange={(evt) => onToggleAllItems(evt.target.checked)}
                label="All connections"
                disabled={disabled}
              />
              {folderItems.map((item) => (
                <Checkbox
                  key={item.id}
                  className={folderItemStyles}
                  data-testid={`folder-filter-${item.id}`}
                  id={`folder-filter-${item.id}`}
                  checked={item.selected}
                  onChange={(evt) => onToggleItem(item.id, evt.target.checked)}
                  label={item.name}
                  disabled={disabled}
                />
              ))}
            </div>
          </>
        )}
      </InteractivePopover>
    </>
  );
}
