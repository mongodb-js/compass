import React, { useCallback, useMemo } from 'react';
import {
  useHoverState,
  spacing,
  css,
  ItemActionControls,
  Icon,
  ServerIcon,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';
import { ROW_HEIGHT, type Actions } from './constants';
import {
  ItemContainer,
  ItemLabel,
  ItemWrapper,
  ItemButtonWrapper,
  ExpandButton,
  type NamespaceItemProps,
} from './tree-item';
import { getItemPaddingStyles } from './utils';
import type { ConnectionTreeItem } from './tree-data';

const iconStyles = css({
  flex: 'none',
});

const connectionItem = css({
  height: ROW_HEIGHT,
});

const itemButtonWrapper = css({
  height: ROW_HEIGHT,
  paddingRight: spacing[1],
});

const connectionItemLabel = css({
  marginLeft: spacing[2],
});

const actionMenu = css({
  width: '240px',
});

type ConnectionItemProps = NamespaceItemProps & {
  item: ConnectionTreeItem;
  onConnectionExpand(): void;
};

export const ConnectionItem = ({
  isActive,
  isReadOnly,
  isSingleConnection,
  item: { name, connectionInfo, level, isExpanded, isPerformanceTabSupported },
  onNamespaceAction,
  onConnectionExpand,
}: ConnectionItemProps) => {
  const [hoverProps, isHovered] = useHoverState();

  const isLocalhost =
    connectionInfo.connectionOptions.connectionString.startsWith(
      'mongodb://localhost'
    ); // TODO(COMPASS-7832)
  const isFavorite = connectionInfo.savedConnectionType === 'favorite';

  const itemPaddingStyles = useMemo(
    () => getItemPaddingStyles({ level, isSingleConnection }),
    [level, isSingleConnection]
  );

  const onExpandButtonClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      onConnectionExpand();
    },
    [onConnectionExpand]
  );

  const onAction = useCallback(
    (action: Actions) => {
      onNamespaceAction(connectionInfo.id, connectionInfo.id, action);
    },
    [connectionInfo.id, onNamespaceAction]
  );

  const actions: ItemAction<Actions>[] = useMemo(() => {
    const isFavorite = connectionInfo.savedConnectionType === 'favorite';

    const actions: ItemAction<Actions>[] = [
      {
        action: 'create-database',
        icon: 'Plus',
        label: 'Create database',
      },
      {
        action: 'connection-performance-metrics',
        icon: 'Gauge',
        label: 'View performance metrics',
        isDisabled: !isPerformanceTabSupported,
        disabledDescription: 'Not supported',
      },
      {
        action: 'open-connection-info',
        icon: 'InfoWithCircle',
        label: 'Show connection info',
      },
      {
        action: 'copy-connection-string',
        icon: 'Copy',
        label: 'Copy connection string',
      },
      {
        action: 'connection-toggle-favorite',
        icon: 'Favorite',
        label: isFavorite ? 'Unfavorite' : 'Favorite',
      },
      {
        action: 'connection-disconnect',
        icon: 'Disconnect',
        label: 'Disconnect',
        variant: 'destructive',
      },
    ];

    return actions;
  }, [connectionInfo.savedConnectionType, isPerformanceTabSupported]);

  const connectionIcon = isLocalhost ? (
    <Icon size={spacing[3]} className={iconStyles} glyph="Laptop" />
  ) : isFavorite ? (
    <Icon size={spacing[3]} className={iconStyles} glyph="Favorite" />
  ) : (
    <ServerIcon />
  );

  return (
    <ItemContainer
      isActive={isActive}
      className={connectionItem}
      {...hoverProps}
    >
      <ItemWrapper>
        <ItemButtonWrapper
          style={itemPaddingStyles}
          className={itemButtonWrapper}
        >
          <ExpandButton
            onClick={onExpandButtonClick}
            isExpanded={isExpanded}
          ></ExpandButton>
          {connectionIcon}
          <ItemLabel className={connectionItemLabel} title={name}>
            {name}
          </ItemLabel>
        </ItemButtonWrapper>
        {!isReadOnly && (
          <ItemActionControls<Actions>
            onAction={onAction}
            isVisible={isActive || isHovered}
            data-testid="sidebar-connection-item-actions"
            iconSize="small"
            actions={actions}
            collapseAfter={1}
            menuClassName={actionMenu}
          ></ItemActionControls>
        )}
      </ItemWrapper>
    </ItemContainer>
  );
};
