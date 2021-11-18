/* eslint-disable react/prop-types */
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import { VisuallyHidden } from '@react-aria/visually-hidden';
import { useId } from '@react-aria/utils';
import { Icon, IconButton, uiColors, spacing, Menu, MenuItem } from '..';
import { useTree, useTreeItem } from '../hooks/use-navigation-tree';
import {
  useHoverState,
  useFocusState,
  FocusState,
} from '../hooks/use-focus-hover';
import { ContentWithFallback } from './content-with-fallback';

const DATABASE_ROW_HEIGHT = spacing[5];
const COLLECTION_ROW_HEIGHT = spacing[4] + spacing[1];
const COLLETIONS_MARGIN_BOTTOM = spacing[1];

const backgroundColor = uiColors.gray.dark2;
const backgroundColorHover = uiColors.gray.dark3;
const backgroundColorActive = uiColors.gray.dark1;

type Collection = {
  _id: string;
  name: string;
  type: string;
};

type Database = {
  _id: string;
  name: string;
  collectionsStatus: string;
  collectionsLength: number;
  collections: Collection[];
};

const focusRing = css({
  position: 'relative',
  '&::after': {
    position: 'absolute',
    content: '""',
    pointerEvents: 'none',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: spacing[1],
    boxShadow: `0 0 0 0 ${uiColors.focus}`,
    transition: 'box-shadow .16s ease-in',
  },
});

const focusRingVisible = css({
  '&::after': {
    boxShadow: `0 0 0 3px ${uiColors.focus}`,
    transitionTimingFunction: 'ease-out',
  },
});

const collectionListItem = css({
  '&:last-of-type': {
    marginBottom: COLLETIONS_MARGIN_BOTTOM,
  },
});

const hoverBackground = css({
  backgroundColor: backgroundColorHover,
});

const collectionItem = css({
  display: 'flex',
  alignItems: 'center',
  height: COLLECTION_ROW_HEIGHT,
  paddingLeft: spacing[5] + spacing[1],
  paddingRight: spacing[1],
  backgroundColor: backgroundColor,
  outline: 'none',
});

const collectionItemIconContainer = css({
  flex: 'none',
  fontSize: 0,
});

const collectionItemName = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginLeft: spacing[2],
});

const CollectionItem: React.FunctionComponent<
  Omit<Collection, '_id'> & {
    id: string;
    posInSet: number;
    setSize: number;
    onNamespaceAction(namespace: string, action: Actions): void;
    isActive: boolean;
    isReadOnly: boolean;
  }
> = ({
  id,
  name,
  type,
  posInSet,
  setSize,
  onNamespaceAction,
  isActive,
  isReadOnly,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusProps, focusState] = useFocusState();
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

  const treeItemProps = useTreeItem({
    level: 2,
    setSize,
    posInSet,
    onDefaultAction,
  });

  const glyph = useMemo(() => {
    return type === 'timeseries'
      ? 'TimeSeries'
      : type === 'view'
      ? 'Visibility'
      : 'Folder';
  }, [type]);

  const onMenuItemClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>, action: Actions) => {
      evt.stopPropagation();
      setIsMenuOpen(false);
      onNamespaceAction(id, action);
    },
    [id, setIsMenuOpen, onNamespaceAction]
  );

  const actions = useMemo(() => {
    const actions: { action: Actions; label: string; icon?: string }[] = [
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
        { action: 'drop-collection', label: 'Drop View' },
        { action: 'duplicate-view', label: 'Duplicate View' },
        { action: 'modify-view', label: 'Modify View' }
      );
    } else {
      actions.push({ action: 'drop-collection', label: 'Drop Collection' });
    }

    return actions;
  }, [type, isReadOnly]);

  const isActionsVisible = isHovered || isActive || isMenuOpen;

  return (
    <li role="none" className={collectionListItem}>
      <div
        data-id={id}
        data-testid={`collection-${id}`}
        className={cx(
          collectionItem,
          focusRing,
          focusState === FocusState.FocusVisible && focusRingVisible,
          isHovered && !isActive && hoverBackground,
          isActive && activeBackground
        )}
        {...focusProps}
        {...hoverProps}
        {...treeItemProps}
      >
        <span className={collectionItemIconContainer}>
          <Icon size="small" glyph={glyph}></Icon>
        </span>
        <span className={collectionItemName}>{name}</span>
        {isActionsVisible && (
          <div className={actionsContainer} data-testid="collection-actions">
            {actions.length > 1 ? (
              <Menu
                open={isMenuOpen}
                setOpen={setIsMenuOpen}
                trigger={({
                  onClick,
                  children,
                }: {
                  onClick(): void;
                  children: React.ReactChildren;
                }) => (
                  <IconButtonSmall
                    glyph="Ellipsis"
                    label="Show collection actions"
                    title="Show collection actions"
                    data-testid="show-collection-actions"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onClick();
                    }}
                    isActive={isActive}
                  >
                    {children}
                  </IconButtonSmall>
                )}
              >
                {actions.map(({ action, label }) => {
                  return (
                    <MenuItem
                      key={action}
                      data-testid={action}
                      onClick={(evt) => {
                        onMenuItemClick(evt, action);
                      }}
                    >
                      {label}
                    </MenuItem>
                  );
                })}
              </Menu>
            ) : (
              <IconButtonSmall
                glyph={actions[0].icon as string}
                isActive={isActive}
                label={actions[0].label}
                title={actions[0].label}
                data-testid={actions[0].action}
                onClick={(evt) => {
                  onMenuItemClick(evt, actions[0].action);
                }}
              ></IconButtonSmall>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

const fadeInAnimation = keyframes({
  '0%': {
    opacity: 0,
  },
  '100%': {
    opacity: 1,
  },
});

const fadeIn = css({
  animation: `${fadeInAnimation} .16s ease-out`,
});

const CollectionsList: React.FunctionComponent<{
  collections: Collection[];
  onNamespaceAction(namespace: string, action: Actions): void;
  activeNamespace?: string;
  isReadOnly: boolean;
}> = ({ collections, onNamespaceAction, activeNamespace, isReadOnly }) => {
  return (
    <ul role="group" className={ulReset}>
      {collections.map((coll, index) => (
        <CollectionItem
          key={coll._id}
          id={coll._id}
          name={coll.name}
          type={coll.type}
          posInSet={index + 1}
          setSize={collections.length}
          onNamespaceAction={onNamespaceAction}
          isActive={coll._id === activeNamespace}
          isReadOnly={isReadOnly}
        />
      ))}
    </ul>
  );
};

const placeholderContainer = css({
  position: 'absolute',
  pointerEvents: 'none',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  opacity: 1,
});

const placeholderContainerHidden = css({
  opacity: 0,
  transition: 'opacity .16s ease-out',
});

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: COLLECTION_ROW_HEIGHT,
  paddingLeft: spacing[5],
});

const placeholderItemContent = css({
  display: 'block',
  height: spacing[3],
  backgroundColor: uiColors.gray.dark1,
  borderRadius: 3,
});

function getBoundRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const PlaceholderItem: React.FunctionComponent = () => {
  const width = useMemo(() => {
    return `${getBoundRandom(30, 80)}%`;
  }, []);

  return (
    <li className={placeholderItem}>
      <span style={{ width }} className={placeholderItemContent}></span>
    </li>
  );
};

const CollectionsListPlaceholder: React.FunctionComponent<{
  length: number;
  isVisible: boolean;
}> = ({ length, isVisible }) => {
  const items = useMemo(() => {
    return Array.from({ length }, (_, index) => (
      <PlaceholderItem key={index}></PlaceholderItem>
    ));
  }, [length]);

  return (
    <ul
      role="presentation"
      data-testid="placeholder"
      className={cx(
        ulReset,
        placeholderContainer,
        !isVisible && placeholderContainerHidden
      )}
    >
      {items}
    </ul>
  );
};

const actionsContainer = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

const databaseItem = css({
  height: DATABASE_ROW_HEIGHT,
  paddingLeft: spacing[1],
  paddingRight: spacing[1],
  display: 'flex',
  alignItems: 'center',
  backgroundColor: backgroundColor,
});

const activeBackground = css({
  backgroundColor: backgroundColorActive,
});

const databaseItemContainer = css({
  contentVisibility: 'auto',
  overflow: 'hidden',
  outline: 'none',
});

const buttonReset = css({
  padding: 0,
  margin: 0,
  background: 'none',
  border: 'none',
});

const databaseIconContainer = css({
  flex: 'none',
  fontSize: 0,
  // Not using leafygreen spacing here because none of them allow to align the
  // button with the search bar content. This probably can go away when we are
  // rebuilding the search also
  padding: 6,
  transition: 'transform .16s linear',
  transform: 'rotate(0deg)',
});

const iconRotated = css({
  transform: 'rotate(90deg)',
});

const databaseItemName = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginLeft: spacing[1],
});

// Using important here because leafygreen / emotion applies styles in the order
// that doesn't allow our styles override theirs
const iconButtonSmall = css({
  width: `${spacing[4]}px !important`,
  height: `${spacing[4]}px !important`,
});

const iconButtonSmallActive = css({
  color: 'currentColor !important',
});

const IconButtonSmall: React.FunctionComponent<{
  glyph: string;
  label: string;
  title?: string;
  onClick(evt: React.MouseEvent<HTMLButtonElement>): void;
  isActive: boolean;
  'data-testid'?: string;
}> = ({ glyph, label, onClick, isActive, children, title, ...rest }) => {
  return (
    <IconButton
      className={cx(iconButtonSmall, isActive && iconButtonSmallActive)}
      aria-label={label}
      title={title}
      onClick={onClick}
      darkMode
      data-testid={rest['data-testid']}
    >
      <Icon role="presentation" glyph={glyph} size="small"></Icon>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
};

const collectionsListContainer = css({
  position: 'relative',
});

const DatabaseItem: React.FunctionComponent<
  Omit<Database, '_id'> & {
    id: string;
    isExpanded: boolean;
    activeNamespace?: string;
    onNamespaceAction(namespace: string, action: Actions): void;
    onExpandClick(id: string, isExpanded: boolean): void;
    setSize: number;
    posInSet: number;
    isReadOnly: boolean;
  }
> = ({
  id,
  name,
  collections,
  collectionsLength,
  collectionsStatus,
  isExpanded,
  activeNamespace,
  onNamespaceAction,
  onExpandClick,
  setSize,
  posInSet,
  isReadOnly,
}) => {
  const [focusProps, focusState] = useFocusState();
  const [hoverProps, isHovered] = useHoverState();

  const onDefaultAction = useCallback(
    (evt) => {
      onNamespaceAction(
        evt.currentTarget.dataset.id as string,
        'select-database'
      );
    },
    [onNamespaceAction]
  );

  const treeItemProps = useTreeItem({
    level: 1,
    setSize,
    posInSet,
    isExpanded,
    onDefaultAction,
  });

  const onExpandButtonClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      onExpandClick(id, !isExpanded);
    },
    [onExpandClick, id, isExpanded]
  );

  const areCollectionsReady = useMemo(() => {
    return ['ready', 'refreshing', 'error'].includes(collectionsStatus);
  }, [collectionsStatus]);

  const length = useMemo(() => {
    return areCollectionsReady ? collections.length : collectionsLength;
  }, [areCollectionsReady, collectionsLength, collections.length]);

  const collectionsListHeight = useMemo(() => {
    return COLLECTION_ROW_HEIGHT * length + COLLETIONS_MARGIN_BOTTOM;
  }, [length]);

  const isActive = useMemo(() => {
    return activeNamespace === id;
  }, [activeNamespace, id]);

  const isActionsVisible = !isReadOnly && (isHovered || isActive);

  const onNamespaceActionClick = useCallback(
    (evt, action) => {
      evt.stopPropagation();
      onNamespaceAction(id, action);
    },
    [onNamespaceAction, id]
  );

  return (
    <li
      role="treeitem"
      data-id={id}
      data-testid={`database-${id}`}
      className={cx(
        databaseItemContainer,
        css({
          containIntrinsicSize: DATABASE_ROW_HEIGHT + collectionsListHeight,
        })
      )}
      {...treeItemProps}
      {...focusProps}
    >
      <div
        className={cx(
          databaseItem,
          isHovered && !isActive && hoverBackground,
          isActive && activeBackground,
          focusRing,
          focusState === FocusState.FocusVisible && focusRingVisible
        )}
        {...hoverProps}
      >
        {/* Can't use leafygreen IconButton here because they don't allow to override tabIndex */}
        <button
          type="button"
          // We don't want this button to be part of the navigation sequence as
          // this breaks the tab flow when navigating through the tree. If you
          // are focused on a particular item in the list, you can expand /
          // collapse it using keyboard, so the button is only valuable when
          // using a mouse
          tabIndex={-1}
          onClick={onExpandButtonClick}
          className={cx(
            buttonReset,
            databaseIconContainer,
            isExpanded && iconRotated
          )}
        >
          <Icon glyph="CaretRight"></Icon>
        </button>
        <span className={databaseItemName}>{name}</span>
        {isActionsVisible && (
          <div className={actionsContainer} data-testid="database-actions">
            <IconButtonSmall
              glyph="Plus"
              label="Create collection"
              title="Create collection"
              onClick={(evt) => {
                onNamespaceActionClick(evt, 'create-collection');
              }}
              isActive={isActive}
              data-testid="database-create-collection"
            ></IconButtonSmall>
            <IconButtonSmall
              glyph="Trash"
              label="Drop database"
              title="Drop database"
              onClick={(evt) => {
                onNamespaceActionClick(evt, 'drop-database');
              }}
              isActive={isActive}
              data-testid="database-drop-database"
            ></IconButtonSmall>
          </div>
        )}
      </div>

      {isExpanded && (
        <div
          className={collectionsListContainer}
          style={{ minHeight: collectionsListHeight }}
        >
          <ContentWithFallback
            isContentReady={areCollectionsReady}
            content={(shouldRender, shouldAnimate) =>
              shouldRender && (
                <div className={cx(shouldAnimate && fadeIn)}>
                  <CollectionsList
                    collections={collections}
                    onNamespaceAction={onNamespaceAction}
                    activeNamespace={activeNamespace}
                    isReadOnly={isReadOnly}
                  />
                </div>
              )
            }
            fallback={(shouldRender) => (
              <CollectionsListPlaceholder
                isVisible={shouldRender}
                length={length}
              ></CollectionsListPlaceholder>
            )}
          ></ContentWithFallback>
        </div>
      )}
    </li>
  );
};

const ulReset = css({
  listStyle: 'none',
  padding: 0,
  margin: 0,
});

const rootList = css({
  overflowX: 'hidden',
  overflowY: 'auto',
});

type Actions =
  | 'select-database'
  | 'drop-database'
  | 'select-collection'
  | 'create-collection'
  | 'drop-collection'
  | 'open-in-new-tab'
  | 'duplicate-view'
  | 'modify-view';

const DatabasesNavigationTree: React.FunctionComponent<{
  databases: Database[];
  expanded?: Record<string, boolean>;
  onDatabaseExpand(id: string, isExpanded: boolean): void;
  onNamespaceAction(namespace: string, action: Actions): void;
  activeNamespace?: string;
  isReadOnly?: boolean;
}> = ({
  databases,
  expanded = {},
  activeNamespace = '',
  onDatabaseExpand,
  onNamespaceAction,
  isReadOnly = false,
}) => {
  const treeProps = useTree({
    ...(activeNamespace && {
      tabbableSelector: `[data-id="${activeNamespace}"]`,
    }),
    onExpandedChange: onDatabaseExpand,
  });

  const id = useId();

  return (
    <>
      <VisuallyHidden id={id}>Databases and Collections</VisuallyHidden>
      <ul aria-labelledby={id} className={cx(ulReset, rootList)} {...treeProps}>
        {databases.map((db, index) => (
          <DatabaseItem
            key={db._id}
            id={db._id}
            name={db.name}
            collections={db.collections}
            collectionsLength={db.collectionsLength}
            collectionsStatus={db.collectionsStatus}
            activeNamespace={activeNamespace}
            isExpanded={expanded[db._id]}
            onExpandClick={onDatabaseExpand}
            onNamespaceAction={onNamespaceAction}
            setSize={databases.length}
            posInSet={index + 1}
            isReadOnly={isReadOnly}
          />
        ))}
      </ul>
    </>
  );
};

export { DatabasesNavigationTree };
