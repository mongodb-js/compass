import React, { useCallback, useMemo } from 'react';
import { isLocalhost } from 'mongodb-build-info';
import {
  Icon,
  IconButton,
  ServerIcon,
  css,
  palette,
  spacing,
  Tooltip,
  cx,
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

const markerBtnStyles = css({
  flex: 'none',
  // This is done to align the size of the static icon buttons with that of the
  // size of action controls
  width: spacing[600],
  height: spacing[600],
});

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

const csfleBtnStyles = css({
  color: palette.gray.dark1,
  background: palette.white,
  border: `1px solid ${palette.gray.light2}`,
  '&:focus': {
    color: palette.gray.dark1,
  },
  '&:focus::before': {
    background: palette.white,
  },
  '&:hover': {
    color: palette.gray.dark1,
  },
  '&:hover::before': {
    background: palette.white,
  },
});

const ConnectionMarker: React.FC<{
  glyph: string;
  label: string;
  tooltip?: string;
  iconBtnClassName?: string;
  onClick(): void;
}> = ({ glyph, label, tooltip, iconBtnClassName, onClick }) => {
  const onTriggerClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onClick();
    },
    [onClick]
  );
  return (
    <Tooltip
      align="top"
      justify="middle"
      trigger={({ children, ...props }) => (
        <div {...props} style={{ display: 'inherit' }}>
          <IconButton
            className={cx(markerBtnStyles, iconBtnClassName)}
            aria-label={label}
            onClick={onTriggerClick}
          >
            {children}
            <Icon glyph={glyph}></Icon>
          </IconButton>
        </div>
      )}
    >
      {tooltip}
    </Tooltip>
  );
};

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

  const connectionMarkers = useMemo(() => {
    if (
      item.type !== 'connection' ||
      item.connectionStatus !== ConnectionStatus.Connected
    ) {
      return [];
    }

    const markers: React.ReactElement[] = [];
    if (!item.isGenuineMongoDB) {
      markers.push(
        <ConnectionMarker
          glyph="Warning"
          label="Non-Genuine MongoDB"
          tooltip="Non-Genuine MongoDB detected"
          iconBtnClassName={nonGenuineBtnStyles}
          onClick={() => onItemAction(item, 'open-non-genuine-mongodb-modal')}
        />
      );
    }

    if (item.csfleMode && item.csfleMode !== 'unavailable') {
      markers.push(
        <ConnectionMarker
          glyph="Key"
          label="In-Use Encryption"
          tooltip="Configure In-Use Encryption"
          iconBtnClassName={csfleBtnStyles}
          onClick={() => onItemAction(item, 'open-csfle-modal')}
        />
      );
    }

    return markers;
  }, [item, onItemAction]);

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
        >
          {connectionMarkers}
        </NavigationBaseItem>
      )}
    </StyledNavigationItem>
  );
}
