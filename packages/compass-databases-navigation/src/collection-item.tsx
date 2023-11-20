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
import { usePreference } from 'compass-preferences-model';

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
});

const itemButtonWrapper = css({
  height: COLLECTION_ROW_HEIGHT,
  paddingRight: spacing[1],
  paddingLeft: spacing[5] + spacing[1] + spacing[4],
});

const collectionItemLabel = css({
  marginLeft: spacing[2],
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
  const isRenameCollectionEnabled = usePreference(
    'enableRenameCollectionModal',
    React
  );
  const [hoverProps, isHovered] = useHoverState();

  const onDefaultAction = useCallback(
    (evt) => {
      if (evt.metaKey || evt.ctrlKey) {
        onNamespaceAction(
          evt.currentTarget.dataset.id as string,
          'open-in-new-tab'
        );
      } else {
        onNamespaceAction(
          evt.currentTarget.dataset.id as string,
          'select-collection'
        );
      }
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

      return actions;
    }

    if (type !== 'timeseries' && isRenameCollectionEnabled) {
      actions.push({
        action: 'rename-collection',
        label: 'Rename collection',
        icon: 'Edit',
      });
    }

    actions.push({
      action: 'drop-collection',
      label: 'Drop collection',
      icon: 'Trash',
    });

    return actions;
  }, [type, isReadOnly, isRenameCollectionEnabled]);

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
      style={style}
      className={collectionItem}
      {...hoverProps}
    >
      <ItemWrapper>
        <ItemButtonWrapper className={itemButtonWrapper}>
          <CollectionIcon type={type} />
          <ItemLabel className={collectionItemLabel} title={name}>
            {name}
          </ItemLabel>
        </ItemButtonWrapper>
        <ItemActionControls<Actions>
          onAction={onAction}
          data-testid="sidebar-collection-item-actions"
          iconSize="small"
          isVisible={isActive || isHovered}
          actions={actions}
        ></ItemActionControls>
      </ItemWrapper>
    </ItemContainer>
  );
};
