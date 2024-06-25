import React, { useCallback, useMemo } from 'react';
import { isLocalhost } from 'mongodb-build-info';
import { Icon, ServerIcon } from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder';
import StyledNavigationItem from './styled-navigation-item';
import { NavigationBaseItem } from './base-navigation-item';
import type { NavigationItemActions } from './item-actions';
import type { SidebarTreeItem, SidebarActionableItem } from './tree-data';
import { getTreeItemStyles } from './utils';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';
import { WithStatusMarker } from './with-status-marker';
import type { Actions } from './constants';

type NavigationItemProps = {
  item: SidebarTreeItem;
  isActive: boolean;
  isFocused: boolean;
  getItemActions: (item: SidebarTreeItem) => NavigationItemActions;
  onItemAction: (item: SidebarActionableItem, action: Actions) => void;
  onItemExpand(item: SidebarActionableItem, isExpanded: boolean): void;
};

export function NavigationItem({
  item,
  isActive,
  isFocused,
  onItemAction,
  onItemExpand,
  getItemActions,
}: NavigationItemProps) {
  const itemIcon = useMemo(() => {
    if (item.type === 'database') {
      return <Icon glyph="Database" />;
    }
    if (item.type === 'collection') {
      return <Icon glyph="Folder" />;
    }
    if (item.type === 'view') {
      return <Icon glyph="Visibility" />;
    }
    if (item.type === 'timeseries') {
      return <Icon glyph="TimeSeries" />;
    }
    if (item.type === 'connection') {
      const isFavorite = item.connectionInfo.savedConnectionType === 'favorite';
      if (isFavorite) {
        return (
          <WithStatusMarker status={item.connectionStatus}>
            <Icon glyph="Favorite" />
          </WithStatusMarker>
        );
      }
      if (isLocalhost(item.connectionInfo.connectionOptions.connectionString)) {
        return (
          <WithStatusMarker status={item.connectionStatus}>
            <Icon glyph="Laptop" />
          </WithStatusMarker>
        );
      }
      return (
        <WithStatusMarker status={item.connectionStatus}>
          <ServerIcon />
        </WithStatusMarker>
      );
    }
  }, [item]);

  const onAction = useCallback(
    (action: Actions) => {
      if (item.type !== 'placeholder') {
        onItemAction(item, action);
      }
    },
    [item, onItemAction]
  );

  const style = useMemo(() => getTreeItemStyles(item), [item]);

  const actionProps = useMemo(() => {
    const collapseAfter = (() => {
      if (item.type === 'connection') {
        if (
          item.connectionStatus !== ConnectionStatus.Connected ||
          !item.hasWriteActionsDisabled
        ) {
          return 1;
        }
        // when connected connection is readonly we don't show the create-database action
        // so the whole action menu is collapsed
        return 0;
      }
    })();

    return {
      actions: getItemActions(item),
      onAction: onAction,
      ...(typeof collapseAfter === 'number' && {
        collapseAfter,
      }),
      ...(item.type === 'database' && {
        collapseToMenuThreshold: 3,
      }),
    };
  }, [getItemActions, item, onAction]);

  const itemDataProps = useMemo(() => {
    if (item.type === 'placeholder') {
      return {};
    }
    if (item.type === 'connection') {
      return {
        'data-is-active': `${isActive}`,
        'data-connection-id': item.connectionInfo.id,
        'data-connection-name': item.name,
      };
    }
    if (item.type === 'database') {
      return {
        'data-is-active': `${isActive}`,
        'data-connection-id': item.connectionId,
        'data-database-name': item.dbName,
      };
    }
    return {
      'data-is-active': `${isActive}`,
      'data-connection-id': item.connectionId,
      'data-namespace': item.namespace,
    };
  }, [item, isActive]);

  return (
    <StyledNavigationItem item={item}>
      {item.type === 'placeholder' ? (
        <PlaceholderItem level={item.level} />
      ) : (
        <NavigationBaseItem
          isActive={isActive}
          isFocused={isFocused}
          isExpanded={!!item.isExpanded}
          icon={itemIcon}
          name={item.name}
          style={style}
          dataAttributes={itemDataProps}
          canExpand={item.isExpandable}
          onExpand={(isExpanded: boolean) => {
            onItemExpand(item, isExpanded);
          }}
          actionProps={actionProps}
        ></NavigationBaseItem>
      )}
    </StyledNavigationItem>
  );
}
