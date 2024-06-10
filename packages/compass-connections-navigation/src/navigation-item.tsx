import React, { useCallback, useMemo } from 'react';
import { isLocalhost } from 'mongodb-build-info';
import { Icon, ServerIcon } from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder';
import StyledNavigationItem from './styled-navigation-item';
import { NavigationBaseItem } from './base-navigation-item';
import type { NavigationItemActions } from './item-actions';
import type { OnExpandedChange } from './virtual-list/virtual-list';
import type { SidebarTreeItem, SidebarActionableItem } from './tree-data';
import { getTreeItemStyles } from './utils';

type NavigationItemProps = {
  item: SidebarTreeItem;
  activeItemId?: string;
  getItemActions: (item: SidebarTreeItem) => NavigationItemActions;
  onItemAction: (
    item: SidebarActionableItem,
    action: NavigationItemActions[number]['action']
  ) => void;
  onItemExpand: OnExpandedChange<SidebarActionableItem>;
};

export function NavigationItem({
  item,
  activeItemId,
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
      if (isLocalhost(item.connectionInfo.connectionOptions.connectionString)) {
        return <Icon glyph="Laptop" />;
      }
      if (isFavorite) {
        return <Icon glyph="Favorite" />;
      }
      return <ServerIcon />;
    }
  }, [item]);

  const onAction = useCallback(
    (action: NavigationItemActions[number]['action']) => {
      if (item.type !== 'placeholder') {
        onItemAction(item, action);
      }
    },
    [item, onItemAction]
  );

  const style = useMemo(() => getTreeItemStyles(item), [item]);

  const actionProps = useMemo(
    () => ({
      actions: getItemActions(item),
      onAction: onAction,
      ...(item.type === 'connection' && {
        collapseAfter: 1,
      }),
      ...(item.type === 'database' && {
        collapseToMenuThreshold: 3,
      }),
    }),
    [getItemActions, item, onAction]
  );

  const itemDataProps = useMemo(() => {
    if (item.type === 'placeholder') {
      return {};
    }
    if (item.type === 'connection') {
      return {
        'data-connection-id': item.connectionInfo.id,
        'data-connection-name': item.name,
      };
    }
    if (item.type === 'database') {
      return {
        'data-connection-id': item.connectionId,
        'data-database-name': item.dbName,
      };
    }
    return {
      'data-connection-id': item.connectionId,
      'data-namespace': item.namespace,
    };
  }, [item]);

  return (
    <StyledNavigationItem colorCode={item.colorCode}>
      {item.type === 'placeholder' ? (
        <PlaceholderItem
          level={item.level}
          maxNestingLevel={item.maxNestingLevel}
        />
      ) : (
        <NavigationBaseItem
          isActive={item.id === activeItemId}
          isExpanded={!!item.isExpanded}
          icon={itemIcon}
          name={item.name}
          style={style}
          dataAttributes={itemDataProps}
          canExpand={item.level < item.maxNestingLevel}
          onExpand={(isExpanded: boolean) => {
            onItemExpand(item, isExpanded);
          }}
          actionProps={actionProps}
        ></NavigationBaseItem>
      )}
    </StyledNavigationItem>
  );
}
