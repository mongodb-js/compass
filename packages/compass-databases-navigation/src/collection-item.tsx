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

const itemWrapper = css({
  position: 'relative',
  width: '100%',
});

const buttonWrapper = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: COLLECTION_ROW_HEIGHT,
  paddingRight: spacing[1],
  paddingLeft: spacing[5] + spacing[1],

  ':hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },
});

const buttonWrapperActive = css({
  paddingRight: spacing[5],
  ':hover': {
    backgroundColor: 'var(--item-bg-color-active)',
  },
});

const itemActionControlsWrapper = css({
  position: 'absolute',
  top: spacing[1],
  right: spacing[1],
});

const collectionItem = css({
  [`:hover .${buttonWrapper}`]: {
    paddingRight: spacing[5],
  },
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
      <div className={itemWrapper}>
        <div className={cx(buttonWrapper, isActive && buttonWrapperActive)}>
          <CollectionIcon type={type} />
          <ItemLabel className={collectionItemLabel} title={name}>
            {name}
          </ItemLabel>
        </div>
        <div className={itemActionControlsWrapper}>
          <ItemActionControls<Actions>
            onAction={onAction}
            data-testid="sidebar-collection-item-actions"
            iconSize="small"
            isVisible={isActive || isHovered}
            actions={actions}
          ></ItemActionControls>
        </div>
      </div>
    </ItemContainer>
  );
};
