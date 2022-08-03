/* eslint-disable react/prop-types */
import React, { useCallback, useMemo } from 'react';
import {
  useHoverState,
  spacing,
  css,
  cx,
} from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';
import { ActionControls } from './item-action-controls';
import type { NamespaceAction } from './item-action-controls';
import { ItemContainer, ItemLabel } from './tree-item';
import type {
  VirtualListItemProps,
  TreeItemProps,
  NamespaceItemProps,
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

  return <SmallIcon glyph={glyph} mode="normal"></SmallIcon>;
};

const collectionItem = css({
  height: COLLECTION_ROW_HEIGHT,
  paddingRight: spacing[1],
});

const collectionItemOldSpacing = css({
  paddingLeft: spacing[5] + spacing[1],
});

const collectionItemNewSpacing = css({
  paddingLeft: spacing[4] + spacing[4] + spacing[1],
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
  isTabbable,
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

  const useNewSidebar = process?.env?.COMPASS_SHOW_NEW_SIDEBAR === 'true';

  return (
    <ItemContainer
      id={id}
      data-testid={`sidebar-collection-${id}`}
      level={2}
      setSize={setSize}
      posInSet={posInSet}
      isActive={isActive}
      isHovered={isHovered}
      isTabbable={isTabbable}
      onDefaultAction={onDefaultAction}
      className={cx(
        collectionItem,
        useNewSidebar ? collectionItemNewSpacing : collectionItemOldSpacing
      )}
      style={style}
      {...hoverProps}
    >
      <CollectionIcon type={type} />
      <ItemLabel className={cx(collectionItemLabel)}>{name}</ItemLabel>
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
