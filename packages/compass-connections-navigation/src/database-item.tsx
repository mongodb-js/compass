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
import { DATABASE_ROW_HEIGHT } from './constants';
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

const databaseItem = css({
  height: DATABASE_ROW_HEIGHT,
});

const itemButtonWrapper = css({
  height: DATABASE_ROW_HEIGHT,
  paddingRight: spacing[1],
  paddingLeft: spacing[2],
});

const databaseItemLabel = css({
  marginLeft: spacing[2],
});

export const DatabaseItem: React.FunctionComponent<
  VirtualListItemProps &
    TreeItemProps &
    NamespaceItemProps & {
      isExpanded: boolean;
      onDatabaseExpand(id: string, isExpanded: boolean): void;
    }
> = ({
  id,
  name,
  posInSet,
  setSize,
  isExpanded,
  isActive,
  isReadOnly,
  isTabbable,
  style,
  onNamespaceAction,
  onDatabaseExpand,
}) => {
  const [hoverProps, isHovered] = useHoverState();

  const onExpandButtonClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      onDatabaseExpand(id, !isExpanded);
    },
    [onDatabaseExpand, id, isExpanded]
  );

  const onDefaultAction = useCallback(
    (evt) => {
      onNamespaceAction(
        evt.currentTarget.dataset.id as string,
        'select-database'
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
        action: 'create-collection',
        icon: 'Plus',
        label: 'Create collection',
      },
      {
        action: 'drop-database',
        icon: 'Trash',
        label: 'Drop database',
      },
    ];
  }, []);

  return (
    <ItemContainer
      id={id}
      data-testid={`sidebar-database-${id}`}
      level={1}
      setSize={setSize}
      posInSet={posInSet}
      isExpanded={isExpanded}
      isActive={isActive}
      isTabbable={isTabbable}
      onDefaultAction={onDefaultAction}
      style={style}
      className={databaseItem}
      {...hoverProps}
    >
      <ItemWrapper>
        <ItemButtonWrapper className={itemButtonWrapper}>
          <ExpandButton
            onClick={onExpandButtonClick}
            isExpanded={isExpanded}
          ></ExpandButton>
          <Icon glyph="Database" size="small"></Icon>
          <ItemLabel className={databaseItemLabel} title={name}>
            {name}
          </ItemLabel>
        </ItemButtonWrapper>
        {!isReadOnly && (
          <ItemActionControls<Actions>
            onAction={onAction}
            isVisible={isActive || isHovered}
            data-testid="sidebar-database-item-actions"
            collapseToMenuThreshold={3}
            iconSize="small"
            actions={actions}
          ></ItemActionControls>
        )}
      </ItemWrapper>
    </ItemContainer>
  );
};
