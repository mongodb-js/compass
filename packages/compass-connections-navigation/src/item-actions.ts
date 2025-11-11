import type { ItemAction } from '@mongodb-js/compass-components';
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
  connectionInfo,
}: {
  connectionInfo: ConnectionInfo;
}): NavigationItemAction[] => {
  const isAtlas = !!connectionInfo.atlasMetadata;
  return stripNullActions([
    isAtlas
      ? null
      : {
          action: 'edit-connection',
          label: 'Edit connection',
          icon: 'Edit',
          disabledDescription: 'Cannot edit an active connection',
        },
    isAtlas
      ? {
          action: 'show-connect-via-modal',
          label: 'Connect via …',
          icon: 'Connect',
        }
      : {
          action: 'copy-connection-string',
          label: 'Copy connection string',
          icon: 'Copy',
        },
    isAtlas
      ? null
      : {
          action: 'connection-toggle-favorite',
          label:
            connectionInfo.savedConnectionType === 'favorite'
              ? 'Unfavorite connection'
              : 'Favorite connection',
          icon: 'Favorite',
        },
    isAtlas
      ? null
      : {
          action: 'duplicate-connection',
          label: 'Duplicate connection',
          icon: 'Clone',
        },
    isAtlas
      ? null
      : {
          action: 'remove-connection',
          label: 'Remove connection',
          icon: 'Trash',
          variant: 'destructive',
        },
  ]);
};

export const connectedConnectionItemActions = ({
  connectionInfo,
  hasWriteActionsDisabled,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isShellEnabled,
}: {
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
    connectionInfo,
  });
  return stripNullActions([
    {
      action: 'refresh-databases',
      label: 'Refresh databases',
      icon: 'Refresh',
    },
    hasWriteActionsDisabled
      ? null
      : {
          action: 'create-database',
          icon: 'Plus',
          label: 'Create database',
        },
    isShellEnabled
      ? {
          action: 'open-shell',
          icon: 'Shell',
          label: 'Open MongoDB shell',
        }
      : null,
    isPerformanceTabAvailable
      ? {
          action: 'connection-performance-metrics',
          icon: 'Gauge',
          label: 'View performance metrics',
          isDisabled: !isPerformanceTabSupported,
          disabledDescription: 'Not supported',
        }
      : null,
    // The following are just links to other parts of Atlas
    !isPerformanceTabAvailable && connectionInfo.atlasMetadata
      ? {
          action: 'connection-atlas-performance-metrics',
          icon: 'Gauge',
          label: 'View performance metrics',
        }
      : null,
    connectionInfo.atlasMetadata
      ? {
          action: 'connection-cluster-overview',
          icon: 'Dashboard',
          label: 'View cluster overview',
        }
      : null,
    connectionInfo.atlasMetadata
      ? {
          action: 'connection-view-monitoring',
          icon: 'TimeSeries',
          label: 'View monitoring',
        }
      : null,
    connectionInfo.atlasMetadata
      ? {
          action: 'connection-query-insights',
          icon: 'Bulb',
          label: 'View query insights',
        }
      : null,
    isAtlas
      ? null
      : {
          action: 'open-connection-info',
          icon: 'InfoWithCircle',
          label: 'Show connection info',
        },
    {
      action: 'connection-disconnect',
      icon: 'Disconnect',
      label: 'Disconnect',
      variant: 'destructive',
    },
    { separator: true },
    ...connectionManagementActions,
  ]);
};

export const notConnectedConnectionItemActions = ({
  connectionInfo,
  connectionStatus,
}: {
  connectionInfo: ConnectionInfo;
  connectionStatus: NotConnectedConnectionStatus;
}): NavigationItemActions => {
  const commonActions = commonConnectionItemActions({ connectionInfo });
  if (connectionStatus === 'connecting') {
    return commonActions;
  } else {
    return [
      {
        action: 'connection-connect',
        label: 'Connect',
        icon: 'Connect',
        expandedAs: ConnectButton,
      },
      ...commonActions,
    ];
  }
};

export const databaseItemActions = ({
  hasWriteActionsDisabled,
  canDeleteDatabase,
}: {
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
      label: 'Create collection',
    },
    canDeleteDatabase
      ? {
          action: 'drop-database',
          icon: 'Trash',
          label: 'Drop database',
        }
      : null,
  ]);
};

export const collectionItemActions = ({
  hasWriteActionsDisabled,
  canEditCollection,
  type,
  isRenameCollectionEnabled,
}: {
  hasWriteActionsDisabled: boolean;
  canEditCollection: boolean;
  type: 'collection' | 'view' | 'timeseries';
  isRenameCollectionEnabled: boolean;
}): NavigationItemActions => {
  const actions: NullableNavigationItemActions = [
    {
      action: 'open-in-new-tab',
      label: 'Open in new tab',
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
        label: 'Duplicate view',
        icon: 'Copy',
      },
      canEditCollection
        ? {
            action: 'modify-view',
            label: 'Modify view',
            icon: 'Edit',
          }
        : null,
      canEditCollection
        ? {
            action: 'drop-collection',
            label: 'Drop view',
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
      label: 'Rename collection',
      icon: 'Edit',
    });
  }

  if (canEditCollection) {
    actions.push({
      action: 'drop-collection',
      label: 'Drop collection',
      icon: 'Trash',
    });
  }

  return stripNullActions(actions);
};

export const connectionContextMenuActions = ({
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isAtlas,
  isShellEnabled,
  hasWriteActionsDisabled,
  connectionInfo,
}: {
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
          ...commonConnectionItemActions({ connectionInfo }),
          { separator: true } as NavigationItemAction,
        ]),
    isShellEnabled
      ? {
          action: 'open-shell',
          icon: 'Shell',
          label: 'Open MongoDB shell',
        }
      : null,
    isPerformanceTabAvailable
      ? {
          action: 'connection-performance-metrics',
          icon: 'Gauge',
          label: 'View performance metrics',
          isDisabled: !isPerformanceTabSupported,
          disabledDescription: 'Not supported',
        }
      : null,
    isAtlas
      ? null
      : {
          action: 'open-connection-info',
          icon: 'InfoWithCircle',
          label: 'Show connection info',
        },
    {
      action: 'refresh-databases',
      label: 'Refresh databases',
      icon: 'Refresh',
    },
    { separator: true },
    {
      action: 'connection-disconnect',
      icon: 'Disconnect',
      label: 'Disconnect',
      variant: 'destructive',
    },
  ]);
};

export const databaseContextMenuActions = ({
  hasWriteActionsDisabled,
  canDeleteDatabase,
  isShellEnabled,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isAtlas,
}: {
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
          label: 'Create collection',
        },
    { separator: true },
    hasWriteActionsDisabled
      ? null
      : {
          action: 'create-database',
          icon: 'Plus',
          label: 'Create database',
        },
    hasWriteActionsDisabled && canDeleteDatabase
      ? null
      : {
          action: 'drop-database',
          icon: 'Trash',
          label: 'Drop database',
        },
    { separator: true },

    ...connectionContextMenuActions({
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
  hasWriteActionsDisabled,
  canEditCollection,
  type,
  isRenameCollectionEnabled,
  isPerformanceTabAvailable,
  isPerformanceTabSupported,
  isAtlas,
  isShellEnabled,
}: {
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
      label: 'Open in new tab',
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
          label: 'Duplicate view',
          icon: 'Copy',
        },
        {
          action: 'modify-view',
          label: 'Modify view',
          icon: 'Edit',
        },
        {
          action: 'drop-collection',
          label: 'Drop view',
          icon: 'Trash',
        },
      ];
    } else {
      writeActions = stripNullActions([
        { separator: true },
        type !== 'timeseries' && canEditCollection && isRenameCollectionEnabled
          ? {
              action: 'rename-collection',
              label: 'Rename collection',
              icon: 'Edit',
            }
          : null,
        {
          action: 'create-collection',
          icon: 'Plus',
          label: 'Create collection',
        },
        canEditCollection
          ? {
              action: 'drop-collection',
              label: 'Drop collection',
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
      isShellEnabled,
      isPerformanceTabAvailable,
      isPerformanceTabSupported,
      isAtlas,
      hasWriteActionsDisabled,
      connectionInfo: undefined,
    }),
  ];
};
