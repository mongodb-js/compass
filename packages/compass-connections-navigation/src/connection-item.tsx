/* eslint-disable react/prop-types */
import React, { useCallback, useMemo } from 'react';
import {
  useHoverState,
  spacing,
  css,
  cx,
  ItemActionControls,
  Icon,
  ServerIcon,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';
import { ROW_HEIGHT } from './constants';
import {
  ItemContainer,
  ItemLabel,
  ItemWrapper,
  ItemButtonWrapper,
  ExpandButton,
} from './tree-item';
import type {
  VirtualListItemProps,
  TreeItemProps,
  NamespaceItemProps,
} from './tree-item';
import type { Actions } from './constants';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { getItemPaddingStyles } from './utils';

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

export const ConnectionItem: React.FunctionComponent<
  VirtualListItemProps &
    TreeItemProps &
    NamespaceItemProps & {
      isExpanded: boolean;
      onConnectionExpand(id: string, isExpanded: boolean): void;
      onConnectionSelect(id: string): void;
    } & { connectionInfo: ConnectionInfo }
> = ({
  id,
  name,
  level,
  posInSet,
  setSize,
  isExpanded,
  isActive,
  isReadOnly,
  isSingleConnection,
  isTabbable,
  style,
  connectionInfo,
  onNamespaceAction,
  onConnectionExpand,
  onConnectionSelect,
}) => {
  const [hoverProps, isHovered] = useHoverState();

  const isLocalhost =
    connectionInfo.connectionOptions.connectionString.startsWith(
      'mongodb://localhost'
    );
  const isFavorite = connectionInfo.savedConnectionType === 'favorite';

  const itemPaddingStyles = useMemo(
    () => getItemPaddingStyles({ level, isSingleConnection }),
    [level, isSingleConnection]
  );

  const onExpandButtonClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      onConnectionExpand(connectionInfo.id, !isExpanded);
    },
    [onConnectionExpand, connectionInfo.id, isExpanded]
  );

  const onDefaultAction = useCallback(
    () => onConnectionSelect(connectionInfo.id),
    [onConnectionSelect, connectionInfo.id]
  );

  const onAction = useCallback(
    (action: Actions) => {
      onNamespaceAction(id, action);
    },
    [id, onNamespaceAction]
  );

  const actions: ItemAction<Actions>[] = useMemo(() => {
    return [
      {
        action: 'connection-options', // TODO(COMPASS-7714)
        icon: 'Ellipsis',
        label: 'Options',
      },
    ];
  }, []);

  const connectionIcon = isLocalhost ? (
    <Icon size={spacing[3]} className={iconStyles} glyph="Laptop" />
  ) : isFavorite ? (
    <Icon size={spacing[3]} className={iconStyles} glyph="Favorite" />
  ) : (
    <ServerIcon />
  );

  return (
    <ItemContainer
      id={id}
      data-testid={`sidebar-connection-${id}`}
      level={level}
      setSize={setSize}
      posInSet={posInSet}
      isExpanded={isExpanded}
      isActive={isActive}
      isTabbable={isTabbable}
      onDefaultAction={onDefaultAction}
      style={style}
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
            collapseToMenuThreshold={3}
            iconSize="small"
            actions={actions}
          ></ItemActionControls>
        )}
      </ItemWrapper>
    </ItemContainer>
  );
};
