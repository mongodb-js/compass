import React, { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { getVirtualTreeItems, type Connection } from './tree-data';
import { ROW_HEIGHT } from './constants';
import type { Actions } from './constants';
import { VirtualTree } from './virtual-list/virtual-list';
import type {
  OnDefaultAction,
  OnExpandedChange,
} from './virtual-list/virtual-list';
import { NavigationItem } from './navigation-item';
import type { SidebarTreeItem, SidebarActionableItem } from './tree-data';
import {
  FadeInPlaceholder,
  VisuallyHidden,
  css,
  spacing,
  useId,
} from '@mongodb-js/compass-components';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { usePreference } from 'compass-preferences-model/provider';
import { TopPlaceholder } from './placeholder';
import {
  collectionItemActions,
  connectionItemActions,
  databaseItemActions,
} from './item-actions';

export interface ConnectionsNavigationTreeProps {
  connections: Connection[];
  expanded?: Record<string, false | Record<string, boolean>>;
  onConnectionExpand?(id: string, isExpanded: boolean): void;
  onConnectionSelect?(id: string): void;
  onDatabaseExpand(connectionId: string, id: string, isExpanded: boolean): void;
  onNamespaceAction(
    connectionId: string,
    namespace: string,
    action: Actions
  ): void;
  activeWorkspace?: WorkspaceTab;
  isReadOnly?: boolean;
}

const ConnectionsNavigationTree: React.FunctionComponent<
  ConnectionsNavigationTreeProps
> = ({
  connections,
  expanded,
  isReadOnly = false,
  activeWorkspace,
  onDatabaseExpand,
  onNamespaceAction,
  // onConnectionExpand and onConnectionSelect only has a default to support single-connection usage
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onConnectionExpand = () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onConnectionSelect = () => {},
}) => {
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const isRenameCollectionEnabled = usePreference(
    'enableRenameCollectionModal'
  );
  const id = useId();

  const treeData = useMemo(() => {
    return getVirtualTreeItems(connections, isSingleConnection, expanded);
  }, [connections, isSingleConnection, expanded]);

  const onDefaultAction: OnDefaultAction<SidebarActionableItem> = useCallback(
    (item, evt) => {
      if (item.type === 'connection') {
        onConnectionSelect(item.connectionInfo.id);
      } else if (item.type === 'database') {
        onNamespaceAction(item.connectionId, item.dbName, 'select-database');
      } else {
        onNamespaceAction(
          item.connectionId,
          item.namespace,
          evt.metaKey || evt.ctrlKey ? 'open-in-new-tab' : 'select-collection'
        );
      }
    },
    [onNamespaceAction, onConnectionSelect]
  );

  const onItemExpand: OnExpandedChange<SidebarActionableItem> = useCallback(
    (item, expanded) => {
      if (item.type === 'connection') {
        onConnectionExpand(item.connectionInfo.id, expanded);
      } else if (item.type === 'database') {
        onDatabaseExpand(item.connectionId, item.dbName, expanded);
      }
    },
    [onConnectionExpand, onDatabaseExpand]
  );

  const onItemAction = useCallback(
    (item: SidebarActionableItem, action: Actions) => {
      const args =
        item.type === 'connection'
          ? ([item.connectionInfo.id, item.connectionInfo.id, action] as const)
          : item.type === 'database'
          ? ([item.connectionId, item.dbName, action] as const)
          : ([item.connectionId, item.namespace, action] as const);
      onNamespaceAction(...args);
    },
    [onNamespaceAction]
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
      if (activeWorkspace.type === 'Databases') {
        return activeWorkspace.connectionId;
      }
    }
  }, [activeWorkspace]);

  const getItemActions = useCallback(
    (item: SidebarTreeItem) => {
      switch (item.type) {
        case 'placeholder':
          return [];
        case 'connection': {
          const isFavorite =
            item.connectionInfo?.savedConnectionType === 'favorite';
          return connectionItemActions({
            isReadOnly,
            isFavorite,
            isPerformanceTabSupported: item.isPerformanceTabSupported,
          });
        }
        case 'database':
          return databaseItemActions({ isReadOnly });
        default:
          return collectionItemActions({
            isReadOnly,
            type: item.type,
            isRenameCollectionEnabled,
          });
      }
    },
    [isReadOnly, isRenameCollectionEnabled]
  );

  const isTestEnv = process.env.NODE_ENV === 'test';

  return (
    <>
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
            onExpandedChange={onItemExpand}
            getItemKey={(item) => item.id}
            renderItem={({ item }) => (
              <NavigationItem
                item={item}
                activeItemId={activeItemId}
                getItemActions={getItemActions}
                onItemExpand={onItemExpand}
                onItemAction={onItemAction}
              />
            )}
          />
        )}
      </AutoSizer>
    </>
  );
};

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

const contentContainer = css({
  display: 'flex',
  flex: '1 0 auto',
});

const NavigationWithPlaceholder: React.FunctionComponent<
  { isReady: boolean } & React.ComponentProps<typeof ConnectionsNavigationTree>
> = ({ isReady, ...props }) => {
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );

  return (
    <FadeInPlaceholder
      className={isSingleConnection ? SCContainer : MCContainer}
      contentContainerProps={{ className: contentContainer }}
      isContentReady={isReady}
      content={() => {
        return (
          <ConnectionsNavigationTree {...props}></ConnectionsNavigationTree>
        );
      }}
      fallback={() => {
        return <TopPlaceholder />;
      }}
    ></FadeInPlaceholder>
  );
};

export { NavigationWithPlaceholder, ConnectionsNavigationTree };
