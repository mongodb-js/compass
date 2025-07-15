import React, { useCallback, useMemo } from 'react';
import {
  cx,
  css,
  palette,
  ItemActionControls,
  useDarkMode,
  useContextMenuGroups,
  type ItemAction,
  type ContextMenuItem,
} from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder';
import StyledNavigationItem from './styled-navigation-item';
import { NavigationBaseItem } from './base-navigation-item';
import type { NavigationItemActions } from './item-actions';
import type { SidebarTreeItem, SidebarActionableItem } from './tree-data';
import { getTreeItemStyles } from './utils';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';
import type { Actions } from './constants';
import { NavigationItemIcon } from './navigation-item-icon';

const nonGenuineBtnStyles = css({
  color: palette.yellow.dark2,
  background: palette.yellow.light3,
  border: `1px solid ${palette.yellow.light2}`,
  '&:focus': {
    color: palette.yellow.dark2,
  },
  '&:focus::before': {
    background: palette.yellow.light3,
  },
  '&:hover': {
    color: palette.yellow.dark2,
  },
  '&:hover::before': {
    background: palette.yellow.light3,
  },
});

const nonGenuineBtnStylesDarkMode = css({
  color: palette.yellow.light2,
  background: palette.yellow.dark3,
  border: `1px solid ${palette.yellow.dark2}`,
  '&:focus': {
    color: palette.yellow.light2,
  },
  '&:focus::before': {
    background: palette.yellow.dark3,
  },
  '&:hover': {
    color: palette.yellow.light2,
  },
  '&:hover::before': {
    background: palette.yellow.dark3,
  },
});

const csfleBtnStyles = css({
  color: palette.gray.dark1,
  background: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
  '&:focus': {
    color: palette.gray.dark1,
  },
  '&:focus::before': {
    background: palette.gray.light3,
  },
  '&:hover': {
    color: palette.gray.dark1,
  },
  '&:hover::before': {
    background: palette.gray.light3,
  },
});

const csfleBtnStylesDarkMode = css({
  color: palette.gray.light3,
  background: palette.gray.dark1,
  border: `1px solid ${palette.gray.base}`,
  '&:focus': {
    color: palette.gray.light3,
  },
  '&:focus::before': {
    background: palette.gray.dark1,
  },
  '&:hover': {
    color: palette.gray.light3,
  },
  '&:hover::before': {
    background: palette.gray.dark1,
  },
});

type NavigationItemProps = {
  item: SidebarTreeItem;
  isActive: boolean;
  isFocused: boolean;
  getItemActions: (item: SidebarTreeItem) => {
    actions: NavigationItemActions;
    config?: {
      collapseAfter: number;
    };
  };
  onItemAction: (item: SidebarActionableItem, action: Actions) => void;
  onItemExpand(item: SidebarActionableItem, isExpanded: boolean): void;
  getContextMenuGroups(item: SidebarTreeItem): ContextMenuItem[][];
};

export function NavigationItem({
  item,
  isActive,
  isFocused,
  onItemAction,
  onItemExpand,
  getItemActions,
  getContextMenuGroups,
}: NavigationItemProps) {
  const isDarkMode = useDarkMode();
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
    const { actions, config: actionsConfig } = getItemActions(item);

    return {
      actions: actions,
      onAction: onAction,
      ...(typeof actionsConfig?.collapseAfter === 'number' && {
        collapseAfter: actionsConfig?.collapseAfter,
      }),
      ...(item.type === 'database' && {
        collapseToMenuThreshold: 3,
      }),
    };
  }, [getItemActions, item, onAction]);

  const contextMenuTriggerRef: React.RefCallback<HTMLDivElement> =
    useContextMenuGroups(
      () => getContextMenuGroups(item),
      [item, getContextMenuGroups]
    );

  const itemDataProps = useMemo(() => {
    if (item.type === 'placeholder') {
      return {};
    }
    if (item.type === 'connection') {
      return {
        'data-is-active': isActive.toString(),
        'data-connection-id': item.connectionInfo.id,
        'data-connection-name': item.name,
        'data-is-connected': (item.connectionStatus === 'connected').toString(),
      };
    }
    if (item.type === 'database') {
      return {
        'data-is-active': isActive.toString(),
        'data-connection-id': item.connectionId,
        'data-database-name': item.dbName,
      };
    }
    return {
      'data-is-active': isActive.toString(),
      'data-connection-id': item.connectionId,
      'data-namespace': item.namespace,
    };
  }, [item, isActive]);

  const connectionStaticActions = useMemo(() => {
    if (
      item.type !== 'connection' ||
      item.connectionStatus !== ConnectionStatus.Connected
    ) {
      return [];
    }

    const actions: ItemAction<Actions>[] = [];
    if (!item.isGenuineMongoDB) {
      actions.push({
        action: 'open-non-genuine-mongodb-modal',
        label: 'Non-Genuine MongoDB',
        tooltip: 'Non-Genuine MongoDB detected',
        icon: 'Warning',
        className: cx(nonGenuineBtnStyles, {
          [nonGenuineBtnStylesDarkMode]: isDarkMode,
        }),
      });
    }

    if (item.csfleMode && item.csfleMode !== 'unavailable') {
      actions.push({
        action: 'open-csfle-modal',
        label: 'In-Use Encryption',
        tooltip: 'Configure In-Use Encryption',
        icon: item.csfleMode === 'enabled' ? 'Lock' : 'Unlock',
        className: cx(csfleBtnStyles, {
          [csfleBtnStylesDarkMode]: isDarkMode,
        }),
      });
    }

    return actions;
  }, [item, isDarkMode]);

  const toggleExpand = useCallback(() => {
    if (item.type !== 'placeholder') {
      onItemExpand(item, !item.isExpanded);
    }
  }, [onItemExpand, item]);

  return (
    <StyledNavigationItem item={item}>
      {item.type === 'placeholder' ? (
        <PlaceholderItem level={item.level} />
      ) : (
        <NavigationBaseItem
          ref={contextMenuTriggerRef}
          item={item}
          isActive={isActive}
          isFocused={isFocused}
          isExpanded={!!item.isExpanded}
          hasDefaultAction={
            item.type !== 'connection' || item.connectionStatus === 'connected'
          }
          icon={<NavigationItemIcon item={item} />}
          name={item.name}
          style={style}
          dataAttributes={itemDataProps}
          isExpandVisible={item.isExpandable}
          isExpandDisabled={
            item.type === 'connection' && item.connectionStatus !== 'connected'
          }
          toggleExpand={toggleExpand}
          actionProps={actionProps}
        >
          {!!connectionStaticActions.length && (
            <ItemActionControls
              iconSize="xsmall"
              actions={connectionStaticActions}
              onAction={onAction}
              // these are static buttons that we want visible always on the
              // sidebar, not as menu item but as action group
              collapseAfter={connectionStaticActions.length}
            />
          )}
        </NavigationBaseItem>
      )}
    </StyledNavigationItem>
  );
}
