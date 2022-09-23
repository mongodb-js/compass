import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  useHoverState,
  css,
  cx,
  ItemActionControls,
  spacing,
  Icon,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';

import DatabaseCollectionFilter from './database-collection-filter';
import SidebarDatabasesNavigation from './sidebar-databases-navigation';

import { changeFilterRegex } from '../modules/databases';

type DatabasesActions = 'open-create-database';

const navigationItem = css({
  cursor: 'pointer',
  color: 'var(--item-color)',
  border: 'none',
  height: spacing[5],
  position: 'relative',

  '& .item-action-controls': {
    marginLeft: 'auto',
    marginRight: spacing[1],
  },

  '&:hover .item-background': {
    display: 'block',
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  '& .item-action-controls:hover + .item-background': {
    display: 'none',
  },

  svg: {
    flexShrink: 0,
  },
});

const activeNavigationItem = css({
  color: 'var(--item-color-active)',
  fontWeight: 'bold',

  '.item-background, :hover .item-background': {
    backgroundColor: 'var(--item-bg-color-active)',
  },

  // this is copied from leafygreen's own navigation, hence the pixel values
  '::before': {
    zIndex: 1,
    backgroundColor: 'var(--item-color-active)',
    content: '""',
    position: 'absolute',
    left: '0px',
    top: '6px',
    bottom: '6px',
    width: '4px',
    borderRadius: '0px 6px 6px 0px',
  },
});

const itemWrapper = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: spacing[5],
  zIndex: 1,
});

const itemBackground = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -1,
});

const itemButtonWrapper = css({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  paddingLeft: spacing[3],
  paddingRight: spacing[1],
});

const navigationItemLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginLeft: spacing[2],
});

const navigationItemActionIcons = css({ color: 'inherit' });

export function NavigationItem<Actions extends string>({
  isExpanded,
  onAction,
  glyph,
  label,
  actions,
  tabName,
  isActive,
}: {
  isExpanded?: boolean;
  onAction(actionName: string, ...rest: any[]): void;
  glyph: string;
  label: string;
  actions?: ItemAction<Actions>[];
  tabName: string;
  isActive: boolean;
}) {
  const [hoverProps] = useHoverState();

  const onClick = useCallback(() => {
    onAction('open-instance-workspace', tabName);
  }, [onAction, tabName]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={cx(navigationItem, isActive && activeNavigationItem)}
      onClick={onClick}
      {...hoverProps}
    >
      <div className={itemWrapper}>
        <div className={itemButtonWrapper}>
          <Icon glyph={glyph} size="small"></Icon>
          {isExpanded && <span className={navigationItemLabel}>{label}</span>}
        </div>
        {isExpanded && actions && (
          <ItemActionControls<Actions>
            iconSize="small"
            onAction={onAction}
            data-testid="sidebar-navigation-item-actions"
            actions={actions}
            // This is what renders the "create database" action,
            // the icons here should always be clearly visible,
            // so we let the icon to inherit the foreground color of
            // the text
            isVisible={true}
            iconClassName={navigationItemActionIcons}
          ></ItemActionControls>
        )}
        <div className={cx('item-background', itemBackground)} />
      </div>
    </div>
  );
}

export function NavigationItems({
  isExpanded,
  changeFilterRegex,
  onAction,
  currentLocation,
}: {
  isExpanded?: boolean;
  changeFilterRegex: any;
  onAction: any;
  currentLocation: string | null;
}) {
  const databasesActions = useMemo(() => {
    const actions: ItemAction<DatabasesActions>[] = [];

    actions.push({
      action: 'open-create-database',
      label: 'Create database',
      icon: 'Plus',
    });

    return actions;
  }, []);

  return (
    <>
      <NavigationItem<''>
        isExpanded={isExpanded}
        onAction={onAction}
        glyph="CurlyBraces"
        label="My Queries"
        tabName="My Queries"
        isActive={currentLocation === 'My Queries'}
      />
      <NavigationItem<DatabasesActions>
        isExpanded={isExpanded}
        onAction={onAction}
        glyph="Database"
        label="Databases"
        tabName="Databases"
        actions={databasesActions}
        isActive={currentLocation === 'Databases'}
      />
      {isExpanded && (
        <DatabaseCollectionFilter changeFilterRegex={changeFilterRegex} />
      )}
      {isExpanded && <SidebarDatabasesNavigation />}
    </>
  );
}

const mapStateToProps = (state: { location: string | null }) => ({
  currentLocation: state.location,
});

const MappedNavigationItems = connect(mapStateToProps, {
  changeFilterRegex,
})(NavigationItems);

export default MappedNavigationItems;
