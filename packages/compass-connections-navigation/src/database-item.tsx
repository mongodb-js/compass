import React, { useCallback, useMemo } from 'react';
import {
  useHoverState,
  spacing,
  css,
  ItemActionControls,
  Icon,
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
import type { DatabaseTreeItem } from './tree-data';

const databaseItem = css({
  height: ROW_HEIGHT,
});

const itemButtonWrapper = css({
  height: ROW_HEIGHT,
  paddingRight: spacing[1],
});

const databaseItemLabel = css({
  marginLeft: spacing[2],
});

type DatabaseItemProps = NamespaceItemProps & {
  item: DatabaseTreeItem;
  onDatabaseExpand(): void;
};

export const DatabaseItem = ({
  connectionId,
  item: { dbName, name, level, isExpanded },
  isActive,
  isReadOnly,
  isSingleConnection,
  onNamespaceAction,
  onDatabaseExpand,
}: DatabaseItemProps) => {
  const [hoverProps, isHovered] = useHoverState();

  const itemPaddingStyles = useMemo(
    () => getItemPaddingStyles({ level, isSingleConnection }),
    [level, isSingleConnection]
  );

  const onExpandButtonClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      onDatabaseExpand();
    },
    [onDatabaseExpand]
  );

  const onAction = useCallback(
    (action: Actions) => {
      onNamespaceAction(connectionId, dbName, action);
    },
    [connectionId, dbName, onNamespaceAction]
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
    <ItemContainer isActive={isActive} className={databaseItem} {...hoverProps}>
      <ItemWrapper>
        <ItemButtonWrapper
          style={itemPaddingStyles}
          className={itemButtonWrapper}
        >
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
