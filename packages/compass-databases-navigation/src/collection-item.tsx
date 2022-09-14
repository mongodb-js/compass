/* eslint-disable react/prop-types */
import React, { useCallback, useMemo } from 'react';
import {
  useHoverState,
  spacing,
  css,
  ItemActionControls,
  Icon,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';
import { COLLECTION_ROW_HEIGHT } from './constants';
import { ItemContainer, ItemLabel } from './tree-item';
import type {
  VirtualListItemProps,
  TreeItemProps,
  NamespaceItemProps,
} from './tree-item';
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

  return <Icon glyph={glyph} size="small"></Icon>;
};

const collectionItem = css({
  height: COLLECTION_ROW_HEIGHT,
  paddingRight: spacing[1],
  paddingLeft: spacing[5] + spacing[1],
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
    const actions: ItemAction<Actions>[] = [
      {
        action: 'open-in-new-tab',
        label: 'Open in new tab',
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
          label: 'Drop view',
          icon: 'Trash',
        },
        {
          action: 'duplicate-view',
          label: 'Duplicate view',
          icon: 'Copy',
        },
        {
          action: 'modify-view',
          label: 'Modify view',
          icon: 'Edit',
        }
      );
    } else {
      actions.push({
        action: 'drop-collection',
        label: 'Drop collection',
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
      isTabbable={isTabbable}
      onDefaultAction={onDefaultAction}
      className={collectionItem}
      style={style}
      {...hoverProps}
    >
      <CollectionIcon type={type} />
      <ItemLabel className={collectionItemLabel} title={name}>
        {name}
      </ItemLabel>
      <ItemActionControls<Actions>
        className={collectionActions}
        onAction={onAction}
        data-testid="sidebar-collection-item-actions"
        iconSize="small"
        isVisible={isActive || isHovered}
        actions={actions}
      ></ItemActionControls>
    </ItemContainer>
  );
};
