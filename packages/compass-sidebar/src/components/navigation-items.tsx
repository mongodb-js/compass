import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  useHoverState,
  css,
  cx,
  ItemActionControls,
  spacing,
  Icon,
  useFocusRing,
  mergeProps,
  useDefaultAction,
  SignalPopover,
  GuideCue,
} from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model';

import type { ItemAction } from '@mongodb-js/compass-components';

import DatabaseCollectionFilter from './database-collection-filter';
import SidebarDatabasesNavigation from './sidebar-databases-navigation';

import { changeFilterRegex } from '../modules/databases';

type DatabasesActions = 'open-create-database' | 'refresh-databases';

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
  gap: spacing[2],
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
});

const signalContainerStyles = css({
  flex: 'none',
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
  showTooManyCollectionsInsight,
}: {
  isExpanded?: boolean;
  onAction(actionName: string, ...rest: any[]): void;
  glyph: string;
  label: string;
  actions?: ItemAction<Actions>[];
  tabName: string;
  isActive: boolean;
  showTooManyCollectionsInsight?: boolean;
}) {
  const onClick = useCallback(() => {
    onAction('open-instance-workspace', tabName);
  }, [onAction, tabName]);

  const [hoverProps] = useHoverState();
  const focusRingProps = useFocusRing();
  const defaultActionProps = useDefaultAction(onClick);

  const navigationItemProps = mergeProps(
    {
      className: cx(navigationItem, isActive && activeNavigationItem),
      ['aria-label']: label,
      ['aria-current']: isActive,
      tabIndex: 0,
    },
    hoverProps,
    defaultActionProps,
    focusRingProps
  ) as React.HTMLProps<HTMLDivElement>;

  return (
    <div {...navigationItemProps}>
      <div className={itemWrapper}>
        <div className={itemButtonWrapper}>
          <Icon glyph={glyph} size="small"></Icon>
          {isExpanded && <span className={navigationItemLabel}>{label}</span>}
        </div>
        {isExpanded && showTooManyCollectionsInsight && (
          <div className={signalContainerStyles}>
            <SignalPopover
              signals={{
                id: 'too-many-collections',
                title: 'Databases with too many collections',
                description:
                  "An excessive number of collections and their associated indexes can drain resources and impact your database's performance. In general, try to limit your replica set to 10,000 collections.",
                learnMoreLink:
                  'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#large-number-of-collections',
              }}
            ></SignalPopover>
          </div>
        )}
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
            collapseToMenuThreshold={3}
          ></ItemActionControls>
        )}
        <div className={cx('item-background', itemBackground)} />
      </div>
    </div>
  );
}

const GuideCueDatabaseIcon = () => {
  return (
    <GuideCue
      cueId="sidebar-no-databases"
      title="It looks a bit empty around here"
      description={
        'Aside from the default databases, you’ll need to create your first database to get to working with data.'
      }
      buttonText="Create a database now"
      onPrimaryButtonClick={() => console.log('open-create-database')}
      trigger={({ ref }) => (
        <span ref={ref}>
          <Icon glyph="Plus" />
        </span>
      )}
    />
  );
};

export function NavigationItems({
  isExpanded,
  isDataLake,
  isWritable,
  changeFilterRegex,
  onAction,
  currentLocation,
  readOnly,
  showTooManyCollectionsInsight = false,
  showCreateDatabaseGuideCue,
}: {
  isExpanded?: boolean;
  isDataLake?: boolean;
  isWritable?: boolean;
  changeFilterRegex(regex: RegExp | null): void;
  onAction(actionName: string, ...rest: any[]): void;
  currentLocation: string | null;
  readOnly?: boolean;
  showTooManyCollectionsInsight?: boolean;
  showCreateDatabaseGuideCue: boolean;
}) {
  const isReadOnly = readOnly || isDataLake || !isWritable;
  const databasesActions = useMemo(() => {
    const actions: ItemAction<DatabasesActions>[] = [
      {
        action: 'refresh-databases',
        label: 'Refresh databases',
        icon: 'Refresh',
      },
    ];

    if (!isReadOnly) {
      actions.push({
        action: 'open-create-database',
        label: 'Create database',
        icon: showCreateDatabaseGuideCue ? <GuideCueDatabaseIcon /> : 'Plus',
      });
    }

    return actions;
  }, [isReadOnly, onAction, showCreateDatabaseGuideCue]);

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
        showTooManyCollectionsInsight={showTooManyCollectionsInsight}
      />
      {isExpanded && (
        <DatabaseCollectionFilter changeFilterRegex={changeFilterRegex} />
      )}
      {isExpanded && <SidebarDatabasesNavigation />}
    </>
  );
}

const DEFAULT_SERVER_DATABASES = ['admin', 'config', 'local'];

const mapStateToProps =
  (state: // TODO(COMPASS-6914): Properly type stores instead of this
  {
    location: string | null;
    databases: {
      databases: any[];
    };
    instance?: {
      dataLake: {
        isDataLake: boolean;
      };
      isWritable: boolean;
      databasesStatus: string;
    };
  }) => {
    const totalCollectionsCount = state.databases.databases.reduce(
      (acc: number, db: { collectionsLength: number }) => {
        return acc + db.collectionsLength;
      },
      0
    );

    const databasesStatus = state.instance?.databasesStatus;
    const isReady =
      databasesStatus !== undefined &&
      !['initial', 'fetching'].includes(databasesStatus);

    const numberOfUserDatabases = state.databases.databases
      .map((x: { _id: string }) => x._id)
      .filter((x) => !DEFAULT_SERVER_DATABASES.includes(x)).length;

    return {
      currentLocation: state.location,
      isDataLake: state.instance?.dataLake.isDataLake,
      isWritable: state.instance?.isWritable,
      showTooManyCollectionsInsight: totalCollectionsCount > 10_000,
      showCreateDatabaseGuideCue: isReady && numberOfUserDatabases === 0,
    };
  };

const MappedNavigationItems = connect(mapStateToProps, {
  changeFilterRegex,
})(withPreferences(NavigationItems, ['readOnly'], React));

export default MappedNavigationItems;
