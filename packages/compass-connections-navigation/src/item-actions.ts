import type { ItemAction, TranslateFn } from '@mongodb-js/compass-components';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { type ItemSeparator } from '@mongodb-js/compass-components';
import { type NotConnectedConnectionStatus } from './tree-data';
import { ConnectButton } from './connect-button';
import type { Actions } from './constants';

export type NavigationItemAction = ItemAction<Actions> | ItemSeparator;
export type NavigationItemActions = NavigationItemAction[];
export type NullableNavigationItemActions = (NavigationItemAction | null)[];

function stripNullActions(
  actions: NullableNavigationItemActions
): NavigationItemActions {
  return actions.filter(
    (action): action is Exclude<typeof action, null> => action !== null
  );
}

export const commonConnectionItemActions = ({
  t,
  connectionInfo,
}: {
  t: TranslateFn;
  connectionInfo: ConnectionInfo;
}): NavigationItemAction[] => {
  const isAtlas = !!connectionInfo.atlasMetadata;
  return stripNullActions([
    isAtlas
      ? null
      : {
          action: 'edit-connection',
          label: t(
            'connectionsNavigation.actions.editConnection',
            'Edit connection'
          ),
          icon: 'Edit',
          disabledDescription: t(
            'connectionsNavigation.actions.cannotEditActive',
            'Cannot edit an active connection'
          ),
        },
    isAtlas
      ? {
          action: 'show-connect-via-modal',
          label: t('connectionsNavigation.actions.connectVia', 'Connect via …'),
          icon: 'Connect',
        }
      : {
          action: 'copy-connection-string',
          label: t(
            'connectionsNavigation.actions.copyConnectionString',
            'Copy connection string'
          ),
          icon: 'Copy',
        },
    isAtlas
      ? null
      : {
          action: 'connection-toggle-favorite',
          label:
            connectionInfo.savedConnectionType === 'favorite'
              ? t(
                  'connectionsNavigation.actions.unfavoriteConnection',
                  'Unfavorite connection'
                )
              : t(
                  'connectionsNavigation.actions.favoriteConnection',
                  'Favorite connection'
                ),
          icon: 'Favorite',
        },
    isAtlas
      ? null
      : {
          action: 'duplicate-connection',
          label: t(
            'connectionsNavigation.actions.duplicateConnection',
            'Duplicate connection'
          ),
          icon: 'Clone',
        },
    isAtlas
      ? null
      : {
          action: 'remove-connection',
          label: t(
            'connectionsNavigation.actions.removeConnection',
            'Remove connection'
          ),
          icon: 'Trash',
          variant: 'destructive',
        },
  ]);
};

export const connectedConnectionItemActions = ({
  t,
  connectionInfo,
  hasWriteActionsDisabled,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isShellEnabled,
}: {
  t: TranslateFn;
  connectionInfo: ConnectionInfo;
  hasWriteActionsDisabled: boolean;
  // Indicates whether or not performance workspace is available in the
  // environment (currently will be false for mms)
  isPerformanceTabAvailable: boolean;
  // Indicates whether or not cluster supports commands required to use
  // performance workspace
  isPerformanceTabSupported: boolean;
  isShellEnabled: boolean;
}): NavigationItemActions => {
  const isAtlas = !!connectionInfo.atlasMetadata;
  const connectionManagementActions = commonConnectionItemActions({
    t,
    connectionInfo,
  });
  return stripNullActions([
    {
      action: 'refresh-databases',
      label: t(
        'connectionsNavigation.actions.refreshDatabases',
        'Refresh databases'
      ),
      icon: 'Refresh',
    },
    hasWriteActionsDisabled
      ? null
      : {
          action: 'create-database',
          icon: 'Plus',
          label: t(
            'connectionsNavigation.actions.createDatabase',
            'Create database'
          ),
        },
    isShellEnabled
      ? {
          action: 'open-shell',
          icon: 'Shell',
          label: t(
            'connectionsNavigation.actions.openShell',
            'Open MongoDB shell'
          ),
        }
      : null,
    isPerformanceTabAvailable
      ? {
          action: 'connection-performance-metrics',
          icon: 'Gauge',
          label: t(
            'connectionsNavigation.actions.viewPerformanceMetrics',
            'View performance metrics'
          ),
          isDisabled: !isPerformanceTabSupported,
          disabledDescription: t(
            'connectionsNavigation.actions.notSupported',
            'Not supported'
          ),
        }
      : null,
    // The following are just links to other parts of Atlas
    !isPerformanceTabAvailable && connectionInfo.atlasMetadata
      ? {
          action: 'connection-atlas-performance-metrics',
          icon: 'Gauge',
          label: t(
            'connectionsNavigation.actions.viewPerformanceMetrics',
            'View performance metrics'
          ),
        }
      : null,
    connectionInfo.atlasMetadata
      ? {
          action: 'connection-cluster-overview',
          icon: 'Dashboard',
          label: t(
            'connectionsNavigation.actions.viewClusterOverview',
            'View cluster overview'
          ),
        }
      : null,
    connectionInfo.atlasMetadata
      ? {
          action: 'connection-view-monitoring',
          icon: 'TimeSeries',
          label: t(
            'connectionsNavigation.actions.viewMonitoring',
            'View monitoring'
          ),
        }
      : null,
    connectionInfo.atlasMetadata
      ? {
          action: 'connection-query-insights',
          icon: 'Bulb',
          label: t(
            'connectionsNavigation.actions.viewQueryInsights',
            'View query insights'
          ),
        }
      : null,
    isAtlas
      ? null
      : {
          action: 'open-connection-info',
          icon: 'InfoWithCircle',
          label: t(
            'connectionsNavigation.actions.showConnectionInfo',
            'Show connection info'
          ),
        },
    {
      action: 'connection-disconnect',
      icon: 'Disconnect',
      label: t('connectionsNavigation.actions.disconnect', 'Disconnect'),
      variant: 'destructive',
    },
    { separator: true },
    ...connectionManagementActions,
  ]);
};

export const notConnectedConnectionItemActions = ({
  t,
  connectionInfo,
  connectionStatus,
}: {
  t: TranslateFn;
  connectionInfo: ConnectionInfo;
  connectionStatus: NotConnectedConnectionStatus;
}): NavigationItemActions => {
  const commonActions = commonConnectionItemActions({ t, connectionInfo });
  if (connectionStatus === 'connecting') {
    return commonActions;
  } else {
    return [
      {
        action: 'connection-connect',
        label: t('connectionsNavigation.actions.connect', 'Connect'),
        icon: 'Connect',
        expandedAs: ConnectButton,
      },
      ...commonActions,
    ];
  }
};

export const databaseItemActions = ({
  t,
  hasWriteActionsDisabled,
  canDeleteDatabase,
}: {
  t: TranslateFn;
  hasWriteActionsDisabled: boolean;
  canDeleteDatabase: boolean;
}): NavigationItemActions => {
  if (hasWriteActionsDisabled) {
    return [];
  }
  return stripNullActions([
    {
      action: 'create-collection',
      icon: 'Plus',
      label: t(
        'connectionsNavigation.actions.createCollection',
        'Create collection'
      ),
    },
    canDeleteDatabase
      ? {
          action: 'drop-database',
          icon: 'Trash',
          label: t(
            'connectionsNavigation.actions.dropDatabase',
            'Drop database'
          ),
        }
      : null,
  ]);
};

export const collectionItemActions = ({
  t,
  hasWriteActionsDisabled,
  canEditCollection,
  type,
  isRenameCollectionEnabled,
}: {
  t: TranslateFn;
  hasWriteActionsDisabled: boolean;
  canEditCollection: boolean;
  type: 'collection' | 'view' | 'timeseries';
  isRenameCollectionEnabled: boolean;
}): NavigationItemActions => {
  const actions: NullableNavigationItemActions = [
    {
      action: 'open-in-new-tab',
      label: t('connectionsNavigation.actions.openInNewTab', 'Open in new tab'),
      icon: 'OpenNewTab',
    },
  ];

  if (hasWriteActionsDisabled) {
    return stripNullActions(actions);
  }

  if (type === 'view') {
    actions.push({ separator: true });
    actions.push(
      {
        action: 'duplicate-view',
        label: t(
          'connectionsNavigation.actions.duplicateView',
          'Duplicate view'
        ),
        icon: 'Copy',
      },
      canEditCollection
        ? {
            action: 'modify-view',
            label: t('connectionsNavigation.actions.modifyView', 'Modify view'),
            icon: 'Edit',
          }
        : null,
      canEditCollection
        ? {
            action: 'drop-collection',
            label: t('connectionsNavigation.actions.dropView', 'Drop view'),
            icon: 'Trash',
          }
        : null
    );

    return stripNullActions(actions);
  }

  if (type !== 'timeseries' && canEditCollection && isRenameCollectionEnabled) {
    actions.push({ separator: true });
    actions.push({
      action: 'rename-collection',
      label: t(
        'connectionsNavigation.actions.renameCollection',
        'Rename collection'
      ),
      icon: 'Edit',
    });
  }

  if (canEditCollection) {
    actions.push({
      action: 'drop-collection',
      label: t(
        'connectionsNavigation.actions.dropCollection',
        'Drop collection'
      ),
      icon: 'Trash',
    });
  }

  return stripNullActions(actions);
};

export const connectionContextMenuActions = ({
  t,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isAtlas,
  isShellEnabled,
  hasWriteActionsDisabled,
  connectionInfo,
}: {
  t: TranslateFn;
  isPerformanceTabAvailable: boolean;
  isPerformanceTabSupported: boolean;
  isAtlas: boolean;
  isShellEnabled: boolean;
  hasWriteActionsDisabled: boolean;
  connectionInfo?: ConnectionInfo;
}): NavigationItemActions => {
  return stripNullActions([
    ...(hasWriteActionsDisabled || !connectionInfo
      ? []
      : [
          ...commonConnectionItemActions({ t, connectionInfo }),
          { separator: true } as NavigationItemAction,
        ]),
    isShellEnabled
      ? {
          action: 'open-shell',
          icon: 'Shell',
          label: t(
            'connectionsNavigation.actions.openShell',
            'Open MongoDB shell'
          ),
        }
      : null,
    isPerformanceTabAvailable
      ? {
          action: 'connection-performance-metrics',
          icon: 'Gauge',
          label: t(
            'connectionsNavigation.actions.viewPerformanceMetrics',
            'View performance metrics'
          ),
          isDisabled: !isPerformanceTabSupported,
          disabledDescription: t(
            'connectionsNavigation.actions.notSupported',
            'Not supported'
          ),
        }
      : null,
    isAtlas
      ? null
      : {
          action: 'open-connection-info',
          icon: 'InfoWithCircle',
          label: t(
            'connectionsNavigation.actions.showConnectionInfo',
            'Show connection info'
          ),
        },
    {
      action: 'refresh-databases',
      label: t(
        'connectionsNavigation.actions.refreshDatabases',
        'Refresh databases'
      ),
      icon: 'Refresh',
    },
    { separator: true },
    {
      action: 'connection-disconnect',
      icon: 'Disconnect',
      label: t('connectionsNavigation.actions.disconnect', 'Disconnect'),
      variant: 'destructive',
    },
  ]);
};

export const databaseContextMenuActions = ({
  t,
  hasWriteActionsDisabled,
  canDeleteDatabase,
  isShellEnabled,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isAtlas,
}: {
  t: TranslateFn;
  hasWriteActionsDisabled: boolean;
  canDeleteDatabase: boolean;
  isShellEnabled: boolean;
  isPerformanceTabAvailable: boolean;
  isPerformanceTabSupported: boolean;
  isAtlas: boolean;
}): NavigationItemActions => {
  return stripNullActions([
    // Database-specific actions
    hasWriteActionsDisabled
      ? null
      : {
          action: 'create-collection',
          icon: 'Plus',
          label: t(
            'connectionsNavigation.actions.createCollection',
            'Create collection'
          ),
        },
    { separator: true },
    hasWriteActionsDisabled
      ? null
      : {
          action: 'create-database',
          icon: 'Plus',
          label: t(
            'connectionsNavigation.actions.createDatabase',
            'Create database'
          ),
        },
    hasWriteActionsDisabled || !canDeleteDatabase
      ? null
      : {
          action: 'drop-database',
          icon: 'Trash',
          label: t(
            'connectionsNavigation.actions.dropDatabase',
            'Drop database'
          ),
        },
    { separator: true },

    ...connectionContextMenuActions({
      t,
      isShellEnabled,
      isPerformanceTabAvailable,
      isPerformanceTabSupported,
      isAtlas,
      hasWriteActionsDisabled,
      connectionInfo: undefined,
    }),
  ]);
};

export const collectionContextMenuActions = ({
  t,
  hasWriteActionsDisabled,
  canEditCollection,
  type,
  isRenameCollectionEnabled,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isAtlas,
  isShellEnabled,
}: {
  t: TranslateFn;
  hasWriteActionsDisabled: boolean;
  canEditCollection: boolean;
  type: 'collection' | 'view' | 'timeseries';
  isRenameCollectionEnabled: boolean;
  isShellEnabled: boolean;
  isPerformanceTabAvailable: boolean;
  isPerformanceTabSupported: boolean;
  isAtlas: boolean;
}): NavigationItemActions => {
  const actions: NavigationItemActions = [
    // Collection-specific actions
    {
      action: 'open-in-new-tab',
      label: t('connectionsNavigation.actions.openInNewTab', 'Open in new tab'),
      icon: 'OpenNewTab',
    },
  ];

  let writeActions: NavigationItemActions = [];

  if (!hasWriteActionsDisabled) {
    if (type === 'view' && canEditCollection) {
      writeActions = [
        { separator: true },
        {
          action: 'duplicate-view',
          label: t(
            'connectionsNavigation.actions.duplicateView',
            'Duplicate view'
          ),
          icon: 'Copy',
        },
        {
          action: 'modify-view',
          label: t('connectionsNavigation.actions.modifyView', 'Modify view'),
          icon: 'Edit',
        },
        {
          action: 'drop-collection',
          label: t('connectionsNavigation.actions.dropView', 'Drop view'),
          icon: 'Trash',
        },
      ];
    } else {
      writeActions = stripNullActions([
        { separator: true },
        type !== 'timeseries' && canEditCollection && isRenameCollectionEnabled
          ? {
              action: 'rename-collection',
              label: t(
                'connectionsNavigation.actions.renameCollection',
                'Rename collection'
              ),
              icon: 'Edit',
            }
          : null,
        {
          action: 'create-collection',
          icon: 'Plus',
          label: t(
            'connectionsNavigation.actions.createCollection',
            'Create collection'
          ),
        },
        canEditCollection
          ? {
              action: 'drop-collection',
              label: t(
                'connectionsNavigation.actions.dropCollection',
                'Drop collection'
              ),
              icon: 'Trash',
            }
          : null,
      ]);
    }
  }

  return [
    ...actions,
    ...writeActions,
    { separator: true },
    ...connectionContextMenuActions({
      t,
      isShellEnabled,
      isPerformanceTabAvailable,
      isPerformanceTabSupported,
      isAtlas,
      hasWriteActionsDisabled,
      connectionInfo: undefined,
    }),
  ];
};
