import React, { useCallback, useMemo } from 'react';
import { isLocalhost } from 'mongodb-build-info';
import {
  Icon,
  ServerIcon,
  cx,
  css,
  palette,
  ItemActionControls,
  type ItemAction,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder';
import StyledNavigationItem from './styled-navigation-item';
import { NavigationBaseItem } from './base-navigation-item';
import type { NavigationItemActions } from './item-actions';
import type { SidebarTreeItem, SidebarActionableItem } from './tree-data';
import { getTreeItemStyles } from './utils';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';
import { WithStatusMarker } from './with-status-marker';
import type { Actions } from './constants';

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
};

export function NavigationItem({
  item,
  isActive,
  isFocused,
  onItemAction,
  onItemExpand,
  getItemActions,
}: NavigationItemProps) {
  const isDarkMode = useDarkMode();
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

    const actions: ItemAction<
      'open-non-genuine-mongodb-modal' | 'open-csfle-modal'
    >[] = [];
    if (!item.isGenuineMongoDB) {
      actions.push({
        action: 'open-non-genuine-mongodb-modal',
        label: 'Non-Genuine MongoDB',
        tooltip: 'Non-Genuine MongoDB detected',
        icon: 'Warning',
        actionButtonClassName: cx(nonGenuineBtnStyles, {
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
        actionButtonClassName: cx(csfleBtnStyles, {
          [csfleBtnStylesDarkMode]: isDarkMode,
        }),
      });
    }

    return actions;
  }, [item, isDarkMode]);

  return (
    <StyledNavigationItem item={item}>
      {item.type === 'placeholder' ? (
        <PlaceholderItem level={item.level} />
      ) : (
        <NavigationBaseItem
          isActive={isActive}
          isFocused={isFocused}
          isExpanded={!!item.isExpanded}
          hasDefaultAction={
            item.type !== 'connection' || item.connectionStatus === 'connected'
          }
          icon={itemIcon}
          name={item.name}
          style={style}
          dataAttributes={itemDataProps}
          isExpandVisible={item.isExpandable}
          isExpandDisabled={
            item.type === 'connection' && item.connectionStatus !== 'connected'
          }
          onExpand={(isExpanded: boolean) => {
            onItemExpand(item, isExpanded);
          }}
          actionProps={actionProps}
        >
          {!!connectionStaticActions.length && (
            <ItemActionControls<Actions>
              iconSize="xsmall"
              actions={connectionStaticActions}
              onAction={onAction}
              // these are static buttons that we want visible always on the
              // sidebar, not as menu item but as action group
              collapseAfter={connectionStaticActions.length}
            ></ItemActionControls>
          )}
        </NavigationBaseItem>
      )}
    </StyledNavigationItem>
  );
}
