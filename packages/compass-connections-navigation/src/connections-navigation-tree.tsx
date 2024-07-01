import React, { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { getVirtualTreeItems } from './tree-data';
import { ROW_HEIGHT } from './constants';
import type { Actions } from './constants';
import { VirtualTree } from './virtual-list/virtual-list';
import type { OnDefaultAction } from './virtual-list/virtual-list';
import { NavigationItem } from './navigation-item';
import type {
  SidebarTreeItem,
  SidebarActionableItem,
  Connection,
} from './tree-data';
import {
  VisuallyHidden,
  css,
  spacing,
  useId,
} from '@mongodb-js/compass-components';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { usePreference } from 'compass-preferences-model/provider';
import {
  collectionItemActions,
  connectedConnectionItemActions,
  databaseItemActions,
  notConnectedConnectionItemActions,
} from './item-actions';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';

const MCContainer = css({
  display: 'flex',
  flex: '1 0 auto',
  height: `calc(100% - ${spacing[1600]}px - ${spacing[200]}px)`,
});

const SCContainer = css({
  display: 'flex',
  flex: '1 0 auto',
  height: 0,
});

export interface ConnectionsNavigationTreeProps {
  connections: Connection[];
  activeWorkspace: WorkspaceTab | null;
  expanded: Record<string, false | Record<string, boolean>>;
  onItemExpand(item: SidebarActionableItem, isExpanded: boolean): void;
  onItemAction(item: SidebarActionableItem, action: Actions): void;
}

const ConnectionsNavigationTree: React.FunctionComponent<
  ConnectionsNavigationTreeProps
> = ({
  connections,
  activeWorkspace,
  expanded,
  onItemExpand,
  onItemAction,
}) => {
  const preferencesReadOnly = usePreference('readOnly');
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const isRenameCollectionEnabled = usePreference(
    'enableRenameCollectionModal'
  );

  const id = useId();

  const treeData = useMemo(() => {
    return getVirtualTreeItems({
      connections,
      isSingleConnection,
      expandedItems: expanded,
      preferencesReadOnly,
    });
  }, [connections, isSingleConnection, expanded, preferencesReadOnly]);

  const onDefaultAction: OnDefaultAction<SidebarActionableItem> = useCallback(
    (item, evt) => {
      if (item.type === 'connection') {
        if (item.connectionStatus === ConnectionStatus.Connected) {
          onItemAction(item, 'select-connection');
        } else if (
          item.connectionStatus === ConnectionStatus.Disconnected ||
          item.connectionStatus === ConnectionStatus.Failed
        ) {
          onItemAction(item, 'connection-connect');
        }
      } else if (item.type === 'database') {
        onItemAction(item, 'select-database');
      } else {
        if (evt.metaKey || evt.ctrlKey) {
          onItemAction(item, 'open-in-new-tab');
        } else {
          onItemAction(item, 'select-collection');
        }
      }
    },
    [onItemAction]
  );

  const activeItemId = useMemo(() => {
    if (activeWorkspace) {
      // Collection or Collections List (of a database)
      if (
        activeWorkspace.type === 'Collection' ||
        activeWorkspace.type === 'Collections'
      ) {
        return `${activeWorkspace.connectionId}.${activeWorkspace.namespace}`;
      }
      // Database List (of a connection)
      if (activeWorkspace.type === 'Databases' && !isSingleConnection) {
        return activeWorkspace.connectionId;
      }
    }
  }, [activeWorkspace, isSingleConnection]);

  const getItemActions = useCallback(
    (item: SidebarTreeItem) => {
      switch (item.type) {
        case 'placeholder':
          return [];
        case 'connection': {
          if (item.connectionStatus === ConnectionStatus.Connected) {
            return connectedConnectionItemActions({
              hasWriteActionsDisabled: item.hasWriteActionsDisabled,
              isShellEnabled: item.isShellEnabled,
              connectionInfo: item.connectionInfo,
              isPerformanceTabSupported: item.isPerformanceTabSupported,
            });
          } else {
            return notConnectedConnectionItemActions({
              connectionInfo: item.connectionInfo,
            });
          }
        }
        case 'database':
          return databaseItemActions({
            hasWriteActionsDisabled: item.hasWriteActionsDisabled,
          });
        default:
          return collectionItemActions({
            hasWriteActionsDisabled: item.hasWriteActionsDisabled,
            type: item.type,
            isRenameCollectionEnabled,
          });
      }
    },
    [isRenameCollectionEnabled]
  );

  const isTestEnv = process.env.NODE_ENV === 'test';

  return (
    <div className={isSingleConnection ? SCContainer : MCContainer}>
      <VisuallyHidden id={id}>Databases and Collections</VisuallyHidden>
      <AutoSizer disableWidth={isTestEnv} disableHeight={isTestEnv}>
        {({ width = isTestEnv ? 1024 : '', height = isTestEnv ? 768 : '' }) => (
          <VirtualTree<SidebarTreeItem>
            dataTestId="sidebar-navigation-tree"
            activeItemId={activeItemId}
            items={treeData}
            width={width}
            height={height}
            itemHeight={ROW_HEIGHT}
            onDefaultAction={onDefaultAction}
            onItemAction={onItemAction}
            onItemExpand={onItemExpand}
            getItemActions={getItemActions}
            getItemKey={(item) => item.id}
            renderItem={({
              item,
              isActive,
              isFocused,
              onItemAction,
              onItemExpand,
              getItemActions,
            }) => {
              return (
                <NavigationItem
                  item={item}
                  isActive={isActive}
                  isFocused={isFocused}
                  getItemActions={getItemActions}
                  onItemExpand={onItemExpand}
                  onItemAction={onItemAction}
                />
              );
            }}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export { ConnectionsNavigationTree };
