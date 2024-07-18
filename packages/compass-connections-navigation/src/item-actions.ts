import type { ItemAction } from '@mongodb-js/compass-components';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { type Actions } from './constants';
import { type ItemSeparator } from '@mongodb-js/compass-components';

export type NavigationItemActions = (ItemAction<Actions> | ItemSeparator)[];

export const notConnectedConnectionItemActions = ({
  connectionInfo,
  isEditDisabled,
}: {
  connectionInfo: ConnectionInfo;
  isEditDisabled?: boolean;
}): NavigationItemActions => {
  return [
    {
      action: 'edit-connection',
      label: 'Edit connection',
      icon: 'Edit',
      isDisabled: isEditDisabled,
      disabledDescription: 'Cannot edit an active connection',
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
  hasWriteActionsDisabled,
  connectionInfo,
  isPerformanceTabSupported,
  isShellEnabled,
}: {
  hasWriteActionsDisabled: boolean;
  connectionInfo: ConnectionInfo;
  isPerformanceTabSupported: boolean;
  isShellEnabled: boolean;
}): NavigationItemActions => {
  const connectionManagementActions = notConnectedConnectionItemActions({
    connectionInfo,
    isEditDisabled: true,
  }).slice(1); // for connected connections we don't show connect action
  const actions: NavigationItemActions = [
    {
      action: 'create-database',
      icon: 'Plus',
      label: 'Create database',
    },
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

  // when connection is readonly we don't want to show create-database action
  // and hence we splice it out here
  if (hasWriteActionsDisabled) {
    actions.splice(0, 1);
  }
  return actions;
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
