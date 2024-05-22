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

import { CollectionItem } from './collection-item';
import { ConnectionItem } from './connection-item';
import { DatabaseItem } from './database-item';
import { PlaceholderItem } from './placeholder-item';
import type { SidebarTreeItem } from './tree-data';
import StyledNavigationItem from './styled-navigation-item';
import {
  FadeInPlaceholder,
  VisuallyHidden,
  css,
  spacing,
  useId,
} from '@mongodb-js/compass-components';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { usePreference } from 'compass-preferences-model/provider';
import { TopPlaceholder } from './top-placeholder';

const collectionItemContainer = css({
  position: 'relative',
});

type NavigationItemProps = {
  item: SidebarTreeItem;
  onExpandItem: OnExpandedChange<SidebarTreeItem>;
} & Pick<
  ConnectionsNavigationTreeProps,
  'activeWorkspace' | 'isSingleConnection' | 'isReadOnly' | 'onNamespaceAction'
>;

function NavigationItem({
  item,
  activeWorkspace,
  isSingleConnection,
  isReadOnly,
  onExpandItem,
  onNamespaceAction,
}: NavigationItemProps) {
  const namespaceProps = useMemo(
    () => ({
      isReadOnly: !!isReadOnly,
      isSingleConnection,
      onNamespaceAction,
    }),
    [isReadOnly, isSingleConnection, onNamespaceAction]
  );
  let Item: React.ReactElement;
  if (item.type === 'placeholder') {
    Item = (
      <PlaceholderItem
        level={item.level}
        isSingleConnection={isSingleConnection}
      ></PlaceholderItem>
    );
  } else if (item.type === 'connection') {
    Item = (
      <ConnectionItem
        item={item}
        connectionId={item.connectionInfo.id}
        isActive={
          activeWorkspace?.type === 'Databases' &&
          activeWorkspace.connectionId === item.connectionInfo.id
        }
        onConnectionExpand={() => onExpandItem(item, !item.isExpanded)}
        {...namespaceProps}
      />
    );
  } else if (item.type === 'database') {
    Item = (
      <DatabaseItem
        item={item}
        connectionId={item.connectionId}
        isActive={
          activeWorkspace?.type === 'Collections' &&
          activeWorkspace.connectionId === item.connectionId &&
          activeWorkspace.namespace === item.dbName
        }
        onDatabaseExpand={() => onExpandItem(item, !item.isExpanded)}
        {...namespaceProps}
      />
    );
  } else {
    Item = (
      <div className={collectionItemContainer}>
        <CollectionItem
          connectionId={item.connectionId}
          isActive={
            activeWorkspace?.type === 'Collection' &&
            activeWorkspace.connectionId === item.connectionId &&
            activeWorkspace.namespace === item.namespace
          }
          item={item}
          {...namespaceProps}
        ></CollectionItem>
      </div>
    );
  }
  return (
    <StyledNavigationItem
      isSingleConnection={isSingleConnection ?? false}
      colorCode={item.colorCode}
    >
      {Item}
    </StyledNavigationItem>
  );
}

interface ConnectionsNavigationTreeProps {
  connections: Connection[];
  expanded?: Record<string, false | Record<string, boolean>>;
  isSingleConnection: boolean;
  onConnectionExpand?(id: string, isExpanded: boolean): void;
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
  isReadOnly,
  activeWorkspace,
  // onConnectionExpand and onConnectionSelect only has a default to support single-connection usage
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onConnectionExpand = () => {},
  onDatabaseExpand,
  onNamespaceAction,
}) => {
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const id = useId();

  const treeData = useMemo(() => {
    return getVirtualTreeItems(connections, isSingleConnection, expanded);
  }, [connections, isSingleConnection, expanded]);

  const onDefaultAction: OnDefaultAction<SidebarTreeItem> = useCallback(
    (item, evt) => {
      if (item.type === 'connection') {
        onNamespaceAction(
          item.connectionInfo.id,
          item.connectionInfo.id,
          'select-connection'
        );
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
    [onNamespaceAction]
  );

  const onExpandItem: OnExpandedChange<SidebarTreeItem> = useCallback(
    (item, expanded) => {
      if (item.type === 'connection') {
        onConnectionExpand?.(item.connectionInfo.id, expanded);
      } else if (item.type === 'database') {
        onDatabaseExpand(item.connectionId, item.dbName, expanded);
      }
    },
    [onConnectionExpand, onDatabaseExpand]
  );

  const activeItemId = useMemo(() => {
    if (!activeWorkspace) {
      return '';
    }
    if (activeWorkspace.type === 'Collection') {
      return `${activeWorkspace.connectionId}.${activeWorkspace.namespace}`;
    }
    if (activeWorkspace.type === 'Collections') {
      return `${activeWorkspace.connectionId}.${activeWorkspace.id}`;
    }
    return activeWorkspace.id;
  }, [activeWorkspace]);

  const isTestEnv = process.env.NODE_ENV === 'test';

  return (
    <>
      <VisuallyHidden id={id}>Databases and Collections</VisuallyHidden>
      <AutoSizer disableWidth={isTestEnv} disableHeight={isTestEnv}>
        {({ width = isTestEnv ? 1024 : '', height = isTestEnv ? 768 : '' }) => (
          <VirtualTree<SidebarTreeItem>
            activeItemId={activeItemId}
            items={treeData}
            width={width}
            height={height}
            itemHeight={ROW_HEIGHT}
            onDefaultAction={onDefaultAction}
            onExpandedChange={onExpandItem}
            getItemKey={(item) => item.key}
            renderItem={({ item }) => (
              <NavigationItem
                item={item}
                isSingleConnection={isSingleConnection}
                onExpandItem={onExpandItem}
                onNamespaceAction={onNamespaceAction}
                activeWorkspace={activeWorkspace}
                isReadOnly={isReadOnly}
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
  height: `calc(100% - ${spacing[3]}px)`,
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
        return (
          <TopPlaceholder
            isSingleConnection={isSingleConnection}
          ></TopPlaceholder>
        );
      }}
    ></FadeInPlaceholder>
  );
};

export { NavigationWithPlaceholder, ConnectionsNavigationTree };
