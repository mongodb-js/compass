import type { ItemAction } from '@mongodb-js/compass-components';
import { type Actions } from './constants';

export type NavigationItemActions = ItemAction<Actions>[];

export const connectionItemActions = ({
  isReadOnly,
  isFavorite,
  isPerformanceTabSupported,
}: {
  isReadOnly: boolean;
  isFavorite: boolean;
  isPerformanceTabSupported: boolean;
}): NavigationItemActions => {
  if (isReadOnly) {
    return [];
  }
  return [
    {
      action: 'create-database',
      icon: 'Plus',
      label: 'Create database',
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
    },
  ];
};

export const databaseItemActions = ({
  isReadOnly,
}: {
  isReadOnly: boolean;
}): NavigationItemActions => {
  if (isReadOnly) {
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
  isReadOnly,
  type,
  isRenameCollectionEnabled,
}: {
  isReadOnly: boolean;
  type: 'collection' | 'view' | 'timeseries';
  isRenameCollectionEnabled: boolean;
}): NavigationItemActions => {
  const actions: ItemAction<Actions>[] = [
    {
      action: 'open-in-new-tab',
      label: 'Open in new tab',
      icon: 'OpenNewTab',
    },
  ];

  if (isReadOnly) {
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
