import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  useHoverState,
  css,
  cx,
  ItemActionControls,
  SmallIcon,
  spacing,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';

import DatabaseCollectionFilter from './database-collection-filter';
import SidebarDatabasesNavigation from './sidebar-databases-navigation';

import { changeFilterRegex } from '../modules/databases';

type DatabasesActions = 'open-create-database';

const navigationItem = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  color: 'var(--item-color)',
  backgroundColor: 'var(--item-bg-color)',
  height: spacing[5],
  paddingLeft: spacing[3],
  paddingRight: spacing[1],

  ':hover': {
    fontWeight: 'bold',
  },
});

const activeNavigationItem = css({
  color: 'var(--item-color-active)',
  backgroundColor: 'var(--item-bg-color-active)',

  // this is copied from leafygreen's own navigation, hence the pixel values
  '::before': {
    backgroundColor: 'var(--item-color-active)',
    content: '""',
    position: 'absolute',
    left: '0px',
    top: '6px',
    bottom: '6px',
    width: '4px',
    borderRadius: '0px 6px 6px 0px',
  },

  ':hover': {
    fontWeight: 'inherit',
  },
});

const navigationItemLabel = css({
  marginLeft: spacing[2],
});

export function NavigationItem<Actions extends string>({
  isExpanded,
  onAction,
  glyph,
  label,
  actions,
}: {
  isExpanded?: boolean;
  onAction(actionName: string): void;
  glyph: string;
  label: string;
  actions?: ItemAction<Actions>[];
}) {
  const isActive = false; // TODO: how do we determine if we're on one of these?
  const [hoverProps, isHovered] = useHoverState();

  return (
    <div
      className={cx(navigationItem, isActive && activeNavigationItem)}
      {...hoverProps}
    >
      <SmallIcon glyph={glyph} mode="normal"></SmallIcon>
      {isExpanded && <span className={navigationItemLabel}>{label}</span>}
      {isExpanded && actions && (
        <ItemActionControls<Actions>
          mode="normal"
          onAction={onAction}
          actions={actions}
          shouldCollapseActionsToMenu
          isActive={isActive}
          isHovered={isHovered}
        ></ItemActionControls>
      )}
    </div>
  );
}

export function NavigationItems({
  isExpanded,
  changeFilterRegex,
  onAction,
}: {
  isExpanded?: boolean;
  changeFilterRegex: any;
  onAction: any;
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
        label="My queries"
      />
      <NavigationItem<DatabasesActions>
        isExpanded={isExpanded}
        onAction={onAction}
        glyph="Database"
        label="Databases"
        actions={databasesActions}
      />
      <DatabaseCollectionFilter changeFilterRegex={changeFilterRegex} />
      <SidebarDatabasesNavigation />
    </>
  );
}

const mapStateToProps = () => ({});

const MappedNavigationItems = connect(mapStateToProps, {
  changeFilterRegex,
})(NavigationItems);

export default MappedNavigationItems;
