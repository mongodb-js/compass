import React from 'react';
import {
  ConfirmationModalArea,
  ToastArea,
  openToast,
  showConfirmation,
} from '@mongodb-js/compass-components';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { DataService } from 'mongodb-data-service/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

type DropIndexInitialProps = Pick<CollectionTabPluginMetadata, 'namespace'>;

type DropIndexServices = {
  localAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'dropIndex'>;
  logger: LoggerAndTelemetry;
};

export function activatePlugin(
  { namespace }: DropIndexInitialProps,
  { localAppRegistry, dataService, logger: { track } }: DropIndexServices,
  { on, cleanup, signal }: ActivateHelpers
) {
  on(localAppRegistry, 'open-drop-index-modal', async (indexName: string) => {
    try {
      track('Screen', { name: 'drop_index_modal' });
      const confirmed = await showConfirmation({
        variant: 'danger',
        title: 'Drop Index',
        description: `Are you sure you want to drop index "${indexName}"?`,
        requiredInputText: indexName,
        buttonText: 'Drop',
        signal,
        'data-testid': 'drop-index-modal',
      });
      if (!confirmed) {
        return;
      }
      await dataService.dropIndex(namespace, indexName);
      track('Index Dropped', { atlas_search: false });
      localAppRegistry.emit('refresh-regular-indexes');
      openToast('drop-index-success', {
        variant: 'success',
        title: `Index "${indexName}" dropped`,
        timeout: 3000,
      });
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      openToast('drop-index-error', {
        variant: 'important',
        title: `Failed to drop index "${indexName}"`,
        description: (err as Error).message,
        timeout: 3000,
      });
    }
  });

  return {
    store: {},
    deactivate: cleanup,
  };
}

/**
 * Drop index plugin doesn't render anything on it's own, but requires
 * compass-component toast and confirmation modal areas to be present
 */
export const DropIndexComponent: React.FunctionComponent = ({ children }) => {
  return (
    <ConfirmationModalArea>
      <ToastArea>{children}</ToastArea>
    </ConfirmationModalArea>
  );
};
