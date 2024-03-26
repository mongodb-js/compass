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
  ExpandButton,
} from './tree-item';
import type {
  VirtualListItemProps,
  TreeItemProps,
  NamespaceItemProps,
} from './tree-item';
import type { Actions } from './constants';
import { getItemPaddingClass } from './utils';

const databaseItem = css({
  height: DATABASE_ROW_HEIGHT,
});

const itemButtonWrapper = css({
  height: DATABASE_ROW_HEIGHT,
  paddingRight: spacing[1],
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
  level,
  posInSet,
  setSize,
  isExpanded,
  isActive,
  isReadOnly,
  isLegacy,
  isTabbable,
  style,
  onNamespaceAction,
  onDatabaseExpand,
}) => {
  const [hoverProps, isHovered] = useHoverState();

  const itemPaddingClass = useMemo(
    () => getItemPaddingClass({ level, isLegacy }),
    [level, isLegacy]
  );

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
      level={level}
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
        <ItemButtonWrapper className={cx(itemButtonWrapper, itemPaddingClass)}>
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
