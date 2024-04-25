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
  palette,
  useDarkMode,
  Tooltip,
} from '@mongodb-js/compass-components';
import {
  usePreference,
  withPreferences,
} from 'compass-preferences-model/provider';
import type { ItemAction } from '@mongodb-js/compass-components';
import DatabaseCollectionFilter from '../database-collection-filter';
import SidebarDatabasesNavigation from './sidebar-databases-navigation';
import { changeFilterRegex } from '../../modules/databases';
import type { RootState } from '../../modules';
import {
  useOpenWorkspace,
  useWorkspacePlugins,
} from '@mongodb-js/compass-workspaces/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

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

const navigationItemDisabledDarkModeStyles = css({
  '--item-color': palette.gray.dark1,
  '--item-color-active': palette.gray.dark1,
  '--item-bg-color-hover': 'var(--item-bg-color)',
});

const navigationItemDisabledLightModeStyles = css({
  '--item-color': palette.gray.base,
  '--item-color-active': palette.gray.base,
  '--item-bg-color-hover': 'var(--item-bg-color)',
});

const navigationItemActionIcons = css({ color: 'inherit' });

export function NavigationItem<Actions extends string>({
  onAction,
  onClick: onButtonClick,
  glyph,
  label,
  actions,
  isActive,
  showTooManyCollectionsInsight,
  disabled: isButtonDisabled = false,
  disabledMessage: buttonDisabledMessage,
}: {
  onAction(actionName: Actions, ...rest: any[]): void;
  onClick(): void;
  glyph: string;
  label: string;
  actions?: ItemAction<Actions>[];
  isActive: boolean;
  showTooManyCollectionsInsight?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const darkMode = useDarkMode();
  const showInsights = usePreference('showInsights');
  const onClick = useCallback(() => {
    if (isButtonDisabled) {
      return;
    }
    onButtonClick();
  }, [isButtonDisabled, onButtonClick]);
  const [hoverProps] = useHoverState();
  const focusRingProps = useFocusRing();
  const defaultActionProps = useDefaultAction(onClick);

  const navigationItemProps = mergeProps(
    {
      className: cx(
        navigationItem,
        isActive && activeNavigationItem,
        isButtonDisabled &&
          (darkMode
            ? navigationItemDisabledDarkModeStyles
            : navigationItemDisabledLightModeStyles)
      ),
      role: 'button',
      ['aria-label']: label,
      ['aria-current']: isActive,
      ['aria-disabled']: isButtonDisabled,
      tabIndex: 0,
    },
    hoverProps,
    defaultActionProps,
    focusRingProps
  ) as React.HTMLProps<HTMLDivElement>;

  return (
    <Tooltip
      align="right"
      spacing={spacing[3]}
      isDisabled={!isButtonDisabled || !buttonDisabledMessage}
      trigger={({ children: tooltip, ...triggerProps }) => {
        const props = mergeProps(triggerProps, navigationItemProps);
        return (
          <div {...props}>
            <div className={itemWrapper}>
              <div className={itemButtonWrapper}>
                <Icon glyph={glyph} size="small"></Icon>
                <span className={navigationItemLabel}>{label}</span>
                {tooltip}
              </div>
              {showInsights && showTooManyCollectionsInsight && (
                <div className={signalContainerStyles}>
                  <SignalPopover
                    signals={PerformanceSignals.get('too-many-collections')}
                  ></SignalPopover>
                </div>
              )}
              {!isButtonDisabled && actions && (
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
      }}
    >
      {buttonDisabledMessage}
    </Tooltip>
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
  connectionInfo,
  showCreateDatabaseAction,
  isPerformanceTabSupported,
  onFilterChange,
  onAction,
  currentLocation,
  currentNamespace,
  showTooManyCollectionsInsight = false,
}: {
  isReady?: boolean;
  connectionInfo: ConnectionInfo;
  showCreateDatabaseAction: boolean;
  isPerformanceTabSupported: boolean;
  onFilterChange(regex: RegExp | null): void;
  onAction(actionName: string, ...rest: any[]): void;
  currentLocation: string | null;
  currentNamespace: string | null;
  showTooManyCollectionsInsight?: boolean;
}) {
  const {
    openMyQueriesWorkspace,
    openPerformanceWorkspace,
    openDatabasesWorkspace,
  } = useOpenWorkspace();
  const { hasWorkspacePlugin } = useWorkspacePlugins();

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
                {hasWorkspacePlugin('My Queries') && (
                  <PlaceholderItem forLabel="My Queries"></PlaceholderItem>
                )}
                {hasWorkspacePlugin('Performance') && (
                  <PlaceholderItem forLabel="Performance"></PlaceholderItem>
                )}
                <PlaceholderItem forLabel="Databases"></PlaceholderItem>
              </>
            )
          );
        }}
        content={(shouldRender) => {
          return (
            shouldRender && (
              <>
                {hasWorkspacePlugin('My Queries') && (
                  <NavigationItem<''>
                    onAction={onAction}
                    onClick={openMyQueriesWorkspace}
                    glyph="CurlyBraces"
                    label="My Queries"
                    isActive={currentLocation === 'My Queries'}
                  />
                )}
                {hasWorkspacePlugin('Performance') && (
                  <NavigationItem<''>
                    onAction={onAction}
                    onClick={() => openPerformanceWorkspace(connectionInfo.id)}
                    glyph="Gauge"
                    label="Performance"
                    isActive={currentLocation === 'Performance'}
                    disabled={!isPerformanceTabSupported}
                    disabledMessage="Performance metrics are not available for your deployment or to your database user"
                  />
                )}
                <NavigationItem<DatabasesActions>
                  onAction={onAction}
                  onClick={() => openDatabasesWorkspace(connectionInfo.id)}
                  glyph="Database"
                  label="Databases"
                  actions={databasesActions}
                  isActive={currentLocation === 'Databases'}
                  showTooManyCollectionsInsight={showTooManyCollectionsInsight}
                />
              </>
            )
          );
        }}
      ></ContentWithFallback>

      <DatabaseCollectionFilter onFilterChange={onFilterChange} />
      <SidebarDatabasesNavigation
        connectionInfo={connectionInfo}
        activeNamespace={currentNamespace ?? undefined}
      />
    </>
  );
}

const mapStateToProps = (
  state: RootState,
  {
    connectionInfo,
    readOnly: preferencesReadOnly,
  }: { connectionInfo: ConnectionInfo; readOnly: boolean }
) => {
  const connectionId = connectionInfo.id;
  const totalCollectionsCount = state.databases[connectionId].databases.reduce(
    (acc: number, db: { collectionsLength: number }) => {
      return acc + db.collectionsLength;
    },
    0
  );

  const isReady =
    ['ready', 'refreshing'].includes(
      state.instance[connectionId]?.status ?? ''
    ) && state.isPerformanceTabSupported !== null;

  const isDataLake = state.instance[connectionId]?.dataLake.isDataLake ?? false;
  const isWritable = state.instance[connectionId]?.isWritable ?? false;

  return {
    isReady,
    showPerformanceItem: !isDataLake,
    showCreateDatabaseAction: !isDataLake && isWritable && !preferencesReadOnly,
    showTooManyCollectionsInsight: totalCollectionsCount > 10_000,
    isPerformanceTabSupported: !isDataLake && !!state.isPerformanceTabSupported,
  };
};

const MappedNavigationItems = withPreferences(
  connect(mapStateToProps, {
    onFilterChange: changeFilterRegex,
  })(NavigationItems),
  ['readOnly']
);

export default MappedNavigationItems;
