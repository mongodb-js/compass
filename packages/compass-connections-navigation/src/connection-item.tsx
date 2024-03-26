/* eslint-disable react/prop-types */
import React, { useCallback, useMemo } from 'react';
import {
  useHoverState,
  spacing,
  css,
  cx,
  ItemActionControls,
  Icon,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';
import { CONNECTION_ROW_HEIGHT } from './constants';
import {
  ItemContainer,
  ItemLabel,
  ItemWrapper,
  ItemButtonWrapper,
} from './tree-item';
import type {
  VirtualListItemProps,
  TreeItemProps,
  NamespaceItemProps,
} from './tree-item';
import type { Actions } from './constants';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { getItemPaddingClass } from './utils';

const buttonReset = css({
  padding: 0,
  margin: 0,
  background: 'none',
  border: 'none',
});

const expandButton = css({
  display: 'flex',
  // Not using leafygreen spacing here because none of them allow to align the
  // button with the search bar content. This probably can go away when we are
  // rebuilding the search also
  padding: 7,
  transition: 'transform .16s linear',
  transform: 'rotate(0deg)',
  '&:hover': {
    cursor: 'pointer',
  },
});

const iconStyles = css({
  flex: 'none',
});

const expanded = css({
  transform: 'rotate(90deg)',
});

const ExpandButton: React.FunctionComponent<{
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isExpanded: boolean;
}> = ({ onClick, isExpanded }) => {
  return (
    <button
      type="button"
      // We don't want this button to be part of the navigation sequence as
      // this breaks the tab flow when navigating through the tree. If you
      // are focused on a particular item in the list, you can expand /
      // collapse it using keyboard, so the button is only valuable when
      // using a mouse
      tabIndex={-1}
      onClick={onClick}
      className={cx(buttonReset, expandButton, isExpanded && expanded)}
    >
      <Icon glyph="CaretRight" size="small"></Icon>
    </button>
  );
};

const connectionItem = css({
  height: CONNECTION_ROW_HEIGHT,
});

const itemButtonWrapper = css({
  height: CONNECTION_ROW_HEIGHT,
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
  isLegacy,
  isTabbable,
  style,
  connectionInfo,
  onNamespaceAction,
  onConnectionExpand,
}) => {
  const [hoverProps, isHovered] = useHoverState();

  const isLocalhost =
    connectionInfo.connectionOptions.connectionString.startsWith(
      'mongodb://localhost'
    );
  const isFavorite = connectionInfo.savedConnectionType === 'favorite';

  const itemPaddingClass = useMemo(
    () => getItemPaddingClass({ level, isLegacy }),
    [level, isLegacy]
  );

  const onExpandButtonClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      onConnectionExpand(id, !isExpanded);
    },
    [onConnectionExpand, id, isExpanded]
  );

  const onDefaultAction = useCallback(
    (evt) => {
      onNamespaceAction(
        evt.currentTarget.dataset.id as string,
        'select-connection'
      );
    },
    [onNamespaceAction]
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
    <div>SERVER</div>
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
        <ItemButtonWrapper className={cx(itemButtonWrapper, itemPaddingClass)}>
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
