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
  PerformanceSignals,
  Placeholder,
  ContentWithFallback,
} from '@mongodb-js/compass-components';
import { usePreference, withPreferences } from 'compass-preferences-model';
import type { ItemAction } from '@mongodb-js/compass-components';

import DatabaseCollectionFilter from './database-collection-filter';
import SidebarDatabasesNavigation from './sidebar-databases-navigation';

import { changeFilterRegex } from '../modules/databases';
import type { RootState } from '../modules';

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

const itemPlaceholderStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: spacing[3],
  height: spacing[5],
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
  const showInsights = usePreference('showInsights', React);
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
        {showInsights && isExpanded && showTooManyCollectionsInsight && (
          <div className={signalContainerStyles}>
            <SignalPopover
              signals={PerformanceSignals.get('too-many-collections')}
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

const PlaceholderItem = ({ forLabel }: { forLabel: string }) => {
  return (
    <div className={itemPlaceholderStyles}>
      <Placeholder width={`${forLabel.length}ch`}></Placeholder>
    </div>
  );
};

export function NavigationItems({
  isReady,
  isExpanded,
  showCreateDatabaseAction = false,
  showPerformanceItem = false,
  onFilterChange,
  onAction,
  currentLocation,
  currentNamespace,
  showTooManyCollectionsInsight = false,
}: {
  isReady?: boolean;
  isExpanded?: boolean;
  showCreateDatabaseAction?: boolean;
  showPerformanceItem?: boolean;
  onFilterChange(regex: RegExp | null): void;
  onAction(actionName: string, ...rest: any[]): void;
  currentLocation: string | null;
  currentNamespace: string | null;
  showTooManyCollectionsInsight?: boolean;
}) {
  const databasesActions = useMemo(() => {
    const actions: ItemAction<DatabasesActions>[] = [
      {
        action: 'refresh-databases',
        label: 'Refresh databases',
        icon: 'Refresh',
      },
    ];

    if (showCreateDatabaseAction) {
      actions.push({
        action: 'open-create-database',
        label: 'Create database',
        icon: 'Plus',
      });
    }

    return actions;
  }, [showCreateDatabaseAction]);

  return (
    <>
      <ContentWithFallback
        isContentReady={!!isReady}
        fallback={(shouldRender) => {
          return (
            shouldRender && (
              <>
                <PlaceholderItem forLabel="My Queries"></PlaceholderItem>
                <PlaceholderItem forLabel="Performance"></PlaceholderItem>
                <PlaceholderItem forLabel="Databases"></PlaceholderItem>
              </>
            )
          );
        }}
        content={(shouldRender) => {
          return (
            shouldRender && (
              <>
                <NavigationItem<''>
                  isExpanded={isExpanded}
                  onAction={onAction}
                  glyph="CurlyBraces"
                  label="My Queries"
                  tabName="My Queries"
                  isActive={currentLocation === 'My Queries'}
                />
                {showPerformanceItem && (
                  <NavigationItem<''>
                    isExpanded={isExpanded}
                    onAction={onAction}
                    glyph="Gauge"
                    label="Performance"
                    tabName="Performance"
                    isActive={currentLocation === 'Performance'}
                  />
                )}
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
              </>
            )
          );
        }}
      ></ContentWithFallback>

      {isExpanded && (
        <DatabaseCollectionFilter onFilterChange={onFilterChange} />
      )}
      {isExpanded && (
        <SidebarDatabasesNavigation
          activeNamespace={currentNamespace ?? undefined}
        />
      )}
    </>
  );
}

const mapStateToProps = (
  state: RootState,
  { readOnly: preferencesReadOnly }: { readOnly: boolean }
) => {
  const totalCollectionsCount = state.databases.databases.reduce(
    (acc: number, db: { collectionsLength: number }) => {
      return acc + db.collectionsLength;
    },
    0
  );

  const isReady = ['ready', 'refreshing'].includes(
    state.instance?.status ?? ''
  );
  const isDataLake = state.instance?.dataLake.isDataLake ?? false;
  const isWritable = state.instance?.isWritable ?? false;

  return {
    isReady,
    showPerformanceItem: !isDataLake,
    showCreateDatabaseAction: !isDataLake && isWritable && !preferencesReadOnly,
    showTooManyCollectionsInsight: totalCollectionsCount > 10_000,
  };
};

const MappedNavigationItems = withPreferences(
  connect(mapStateToProps, {
    onFilterChange: changeFilterRegex,
  })(NavigationItems),
  ['readOnly'],
  React
);

export default MappedNavigationItems;
