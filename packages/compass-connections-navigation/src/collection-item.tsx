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
  type NamespaceItemProps,
} from './tree-item';
import { usePreference } from 'compass-preferences-model/provider';
import { getItemPaddingStyles } from './utils';
import type { CollectionTreeItem } from './tree-data';

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
  height: ROW_HEIGHT,
});

const itemButtonWrapper = css({
  height: ROW_HEIGHT,
  paddingRight: spacing[1],
});

const collectionItemLabel = css({
  marginLeft: spacing[2],
});

type CollectionItemProps = NamespaceItemProps & {
  item: CollectionTreeItem;
};

export const CollectionItem = ({
  connectionId,
  item: { name, type, level, namespace },
  isActive,
  isReadOnly,
  isSingleConnection,
  onNamespaceAction,
}: CollectionItemProps) => {
  const isRenameCollectionEnabled = usePreference(
    'enableRenameCollectionModal'
  );
  const [hoverProps, isHovered] = useHoverState();

  const itemPaddingStyles = useMemo(
    () => getItemPaddingStyles({ level, isSingleConnection }),
    [level, isSingleConnection]
  );

  const onAction = useCallback(
    (action: Actions) => {
      onNamespaceAction(connectionId, namespace, action);
    },
    [connectionId, namespace, onNamespaceAction]
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
      isActive={isActive}
      className={collectionItem}
      {...hoverProps}
    >
      <ItemWrapper>
        <ItemButtonWrapper
          style={itemPaddingStyles}
          className={itemButtonWrapper}
        >
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
