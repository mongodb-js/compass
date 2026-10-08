import React from 'react';
import {
  openToast,
  showConfirmation,
  ConfirmationModalArea,
  ToastArea,
  translate,
} from '@mongodb-js/compass-components';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import toNS from 'mongodb-ns';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';

type NS = ReturnType<typeof toNS>;

type DropNamespaceServices = {
  globalAppRegistry: AppRegistry;
  connections: ConnectionsService;
  logger: Logger;
  track: TrackFunction;
  preferences: PreferencesAccess;
};

export function activatePlugin(
  _: unknown,
  { globalAppRegistry, connections, track, preferences }: DropNamespaceServices,
  { on, cleanup, signal }: ActivateHelpers
) {
  const onDropNamespace = async (
    namespace: string | NS,
    { connectionId }: { connectionId?: string } = {}
  ) => {
    // `drop-collection` is emitted with NS, `drop-database` is emitted with a
    // string, we're keeping compat with both for now to avoid conflicts with
    // other refactoring
    if (typeof namespace === 'string') {
      namespace = toNS(namespace);
    }

    if (!connectionId) {
      throw new Error(
        'Cannot drop a namespace without specifying connectionId'
      );
    }

    const {
      ns,
      validCollectionName: isCollection,
      database,
      collection,
    } = namespace;
    const language = preferences.getPreferences().language ?? 'en';
    track(
      'Screen',
      {
        name: isCollection ? 'drop_collection_modal' : 'drop_database_modal',
      },
      undefined
    );
    const confirmed = await showConfirmation({
      variant: 'danger',
      title: isCollection
        ? translate(
            language,
            'databasesCollections.drop.collectionTitle',
            'Drop Collection?'
          )
        : translate(
            language,
            'databasesCollections.drop.databaseTitle',
            'Drop Database?'
          ),
      description: isCollection
        ? translate(
            language,
            'databasesCollections.drop.collectionDescription',
            'Are you sure you want to drop collection "{ns}"?',
            { ns }
          )
        : translate(
            language,
            'databasesCollections.drop.databaseDescription',
            'Are you sure you want to drop database "{ns}"?',
            { ns }
          ),
      requiredInputText: isCollection ? collection : database,
      buttonText: isCollection
        ? translate(
            language,
            'databasesCollections.drop.collectionButton',
            'Drop Collection'
          )
        : translate(
            language,
            'databasesCollections.drop.databaseButton',
            'Drop Database'
          ),
      'data-testid': 'drop-namespace-confirmation-modal',
      signal,
    });
    if (confirmed) {
      try {
        const dataService =
          connections.getDataServiceForConnection(connectionId);

        await (isCollection
          ? dataService.dropCollection(ns)
          : dataService.dropDatabase(ns));
        track(
          isCollection ? 'Collection Dropped' : 'Database Dropped',
          {},
          connections.getConnectionById(connectionId)?.info
        );
        globalAppRegistry.emit(
          isCollection ? 'collection-dropped' : 'database-dropped',
          ns,
          { connectionId }
        );
        openToast('drop-namespace-success', {
          variant: 'success',
          title: isCollection
            ? translate(
                language,
                'databasesCollections.drop.collectionDropped',
                'Collection "{ns}" dropped',
                { ns }
              )
            : translate(
                language,
                'databasesCollections.drop.databaseDropped',
                'Database "{ns}" dropped',
                { ns }
              ),
          timeout: 3000,
        });
      } catch (err) {
        if (signal.aborted) {
          return;
        }
        openToast('drop-namespace-error', {
          variant: 'important',
          title: isCollection
            ? translate(
                language,
                'databasesCollections.drop.collectionFailed',
                'Failed to drop collection "{ns}"',
                { ns }
              )
            : translate(
                language,
                'databasesCollections.drop.databaseFailed',
                'Failed to drop database "{ns}"',
                { ns }
              ),
          description: (err as Error).message,
          timeout: 3000,
        });
      }
    }
  };

  on(globalAppRegistry, 'open-drop-database', onDropNamespace);
  on(globalAppRegistry, 'open-drop-collection', onDropNamespace);

  return {
    store: {},
    deactivate: cleanup,
  };
}

/**
 * Drop namespace plugin doesn't render anything on it's own, but requires
 * compass-component toast and confirmation modal areas to be present
 */
export const DropNamespaceComponent: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <ConfirmationModalArea>
      <ToastArea>{children}</ToastArea>
    </ConfirmationModalArea>
  );
};
