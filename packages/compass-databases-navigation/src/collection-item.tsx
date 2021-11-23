/* eslint-disable react/prop-types */
import { css } from '@leafygreen-ui/emotion';
import React, { useCallback, useMemo } from 'react';
import { useHoverState, spacing } from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';
import { NamespaceAction, ActionControls } from './item-action-controls';
import {
  VirtualListItemProps,
  TreeItemProps,
  NamespaceItemProps,
  ItemContainer,
  ItemLabel,
} from './tree-item';
import { SmallIcon } from './icon-button';
import type { Actions } from './constants';

const CollectionIcon: React.FunctionComponent<{
  type: string;
}> = ({ type }) => {
  const glyph = useMemo(() => {
    return type === 'timeseries'
      ? 'TimeSeries'
      : type === 'view'
      ? 'Visibility'
      : 'Folder';
  }, [type]);
  return <SmallIcon glyph={glyph}></SmallIcon>;
};
const collectionItem = css({
  height: COLLECTION_ROW_HEIGHT,
  paddingLeft: spacing[5] + spacing[1],
  paddingRight: spacing[1],
});
const collectionItemLabel = css({
  marginLeft: spacing[2],
});
const collectionActions = css({
  marginLeft: 'auto',
});
export const CollectionItem: React.FunctionComponent<
  VirtualListItemProps & TreeItemProps & NamespaceItemProps
> = ({
  id,
  name,
  type,
  posInSet,
  setSize,
  isActive,
  isReadOnly,
  style,
  onNamespaceAction,
}) => {
  const [hoverProps, isHovered] = useHoverState();

  const onDefaultAction = useCallback(
    (evt) => {
      onNamespaceAction(
        evt.currentTarget.dataset.id as string,
        'select-collection'
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

  const actions = useMemo(() => {
    const actions: NamespaceAction[] = [
      {
        action: 'open-in-new-tab',
        label: 'Open in New Tab',
        icon: 'OpenNewTab',
      },
    ];

    if (isReadOnly) {
      return actions;
    }

    if (type === 'view') {
      actions.push(
        {
          action: 'drop-collection',
          label: 'Drop View',
          icon: 'Trash',
        },
        {
          action: 'duplicate-view',
          label: 'Duplicate View',
          icon: 'Copy',
        },
        {
          action: 'modify-view',
          label: 'Modify View',
          icon: 'Edit',
        }
      );
    } else {
      actions.push({
        action: 'drop-collection',
        label: 'Drop Collection',
        icon: 'Trash',
      });
    }

    return actions;
  }, [type, isReadOnly]);

  return (
    <ItemContainer
      id={id}
      data-testid={`sidebar-collection-${id}`}
      level={2}
      setSize={setSize}
      posInSet={posInSet}
      isActive={isActive}
      isHovered={isHovered}
      onDefaultAction={onDefaultAction}
      className={collectionItem}
      style={style}
      {...hoverProps}
    >
      <CollectionIcon type={type} />
      <ItemLabel className={collectionItemLabel}>{name}</ItemLabel>
      <ActionControls
        className={collectionActions}
        onAction={onAction}
        isActive={isActive}
        isHovered={isHovered}
        actions={actions}
        shouldCollapseActionsToMenu
      ></ActionControls>
    </ItemContainer>
  );
};
