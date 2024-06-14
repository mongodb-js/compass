import type { ItemAction } from '@mongodb-js/compass-components';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { type Actions } from './constants';

export type NavigationItemActions = ItemAction<Actions>[];

export const notConnectedConnectionItemActions = ({
  connectionInfo,
}: {
  connectionInfo: ConnectionInfo;
  activeConnectionsCount?: number;
  maxOpenConnectionsAllowed?: number;
}): NavigationItemActions => {
  return [
    {
      action: 'connection-connect',
      icon: 'Connect',
      label: 'Connect',
    },
    {
      action: 'edit-connection',
      label: 'Edit connection',
      icon: 'Edit',
    },
    {
      action: 'copy-connection-string',
      label: 'Copy connection string',
      icon: 'Copy',
    },
    {
      action: 'connection-toggle-favorite',
      label:
        connectionInfo.savedConnectionType === 'favorite'
          ? 'Unfavorite'
          : 'Favorite',
      icon: 'Favorite',
    },
    {
      action: 'duplicate-connection',
      label: 'Duplicate',
      icon: 'Clone',
    },
    {
      action: 'remove-connection',
      label: 'Remove',
      icon: 'Trash',
      variant: 'destructive',
    },
  ];
};

export const connectedConnectionItemActions = ({
  hasWriteActionsEnabled,
  isFavorite,
  isPerformanceTabSupported,
  isShellEnabled,
}: {
  hasWriteActionsEnabled: boolean;
  isFavorite: boolean;
  isPerformanceTabSupported: boolean;
  isShellEnabled: boolean;
}): NavigationItemActions => {
  const actions: NavigationItemActions = [];
  if (!hasWriteActionsEnabled) {
    actions.push({
      action: 'create-database',
      icon: 'Plus',
      label: 'Create database',
    });
  }
  actions.push(
    {
      action: 'open-shell',
      icon: 'Shell',
      label: 'Open MongoDB shell',
      isDisabled: !isShellEnabled,
      disabledDescription: 'Not available',
    },
    {
      action: 'connection-performance-metrics',
      icon: 'Gauge',
      label: 'View performance metrics',
      isDisabled: !isPerformanceTabSupported,
      disabledDescription: 'Not supported',
    },
    {
      action: 'open-connection-info',
      icon: 'InfoWithCircle',
      label: 'Show connection info',
    },
    {
      action: 'copy-connection-string',
      icon: 'Copy',
      label: 'Copy connection string',
    },
    {
      action: 'connection-toggle-favorite',
      icon: 'Favorite',
      label: isFavorite ? 'Unfavorite' : 'Favorite',
    },
    {
      action: 'connection-disconnect',
      icon: 'Disconnect',
      label: 'Disconnect',
      variant: 'destructive',
    }
  );
  return actions;
};

export const databaseItemActions = ({
  hasWriteActionsEnabled,
}: {
  hasWriteActionsEnabled: boolean;
}): NavigationItemActions => {
  if (hasWriteActionsEnabled) {
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
  hasWriteActionsEnabled,
  type,
  isRenameCollectionEnabled,
}: {
  hasWriteActionsEnabled: boolean;
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

  if (hasWriteActionsEnabled) {
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
