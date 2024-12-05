import type { ItemAction } from '@mongodb-js/compass-components';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { type Actions } from './constants';
import { type ItemSeparator } from '@mongodb-js/compass-components';
import { type NotConnectedConnectionStatus } from './tree-data';
import { ConnectButton } from './connect-button';

export type NavigationItemActions = (ItemAction<Actions> | ItemSeparator)[];

export const commonConnectionItemActions = ({
  connectionInfo,
}: {
  connectionInfo: ConnectionInfo;
}): NavigationItemActions => {
  const isAtlas = !!connectionInfo.atlasMetadata;
  const actions: (ItemAction<Actions> | ItemSeparator | null)[] = [
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
              ? 'Unfavorite'
              : 'Favorite',
          icon: 'Favorite',
        },
    isAtlas
      ? null
      : {
          action: 'duplicate-connection',
          label: 'Duplicate',
          icon: 'Clone',
        },
    isAtlas
      ? null
      : {
          action: 'remove-connection',
          label: 'Remove',
          icon: 'Trash',
          variant: 'destructive',
        },
  ];

  return actions.filter((action): action is Exclude<typeof action, null> => {
    return !!action;
  });
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
  const actions: (ItemAction<Actions> | ItemSeparator | null)[] = [
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
    {
      action: 'connection-disconnect',
      icon: 'Disconnect',
      label: 'Disconnect',
      variant: 'destructive',
    },
    { separator: true },
    ...connectionManagementActions,
  ];

  return actions.filter((action): action is Exclude<typeof action, null> => {
    return !!action;
  });
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
}: {
  hasWriteActionsDisabled: boolean;
}): NavigationItemActions => {
  if (hasWriteActionsDisabled) {
    return [];
  }
  return [
    {
      action: 'create-collection',
      icon: 'Plus',
      label: 'Create collection',
    },
    {
      action: 'drop-database',
      icon: 'Trash',
      label: 'Drop database',
    },
  ];
};

export const collectionItemActions = ({
  hasWriteActionsDisabled,
  type,
  isRenameCollectionEnabled,
}: {
  hasWriteActionsDisabled: boolean;
  type: 'collection' | 'view' | 'timeseries';
  isRenameCollectionEnabled: boolean;
}): NavigationItemActions => {
  const actions: NavigationItemActions = [
    {
      action: 'open-in-new-tab',
      label: 'Open in new tab',
      icon: 'OpenNewTab',
    },
  ];

  if (hasWriteActionsDisabled) {
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
};
