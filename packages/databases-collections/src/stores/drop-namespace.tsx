import React from 'react';
import {
  openToast,
  showConfirmation,
  ConfirmationModalArea,
  ToastArea,
} from '@mongodb-js/compass-components';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import toNS from 'mongodb-ns';

type NS = ReturnType<typeof toNS>;

type DropNamespaceServices = {
  globalAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'dropDatabase' | 'dropCollection'>;
  logger: LoggerAndTelemetry;
};

export function activatePlugin(
  _: unknown,
  { globalAppRegistry, dataService, logger: { track } }: DropNamespaceServices
) {
  const onDropNamespace = (ns: string | NS) => {
    // `drop-collection` is emitted with NS, `drop-database` is emitted with a
    // string, we're keeping compat with both for now to avoid conflicts with
    // other refactoring
    if (typeof ns === 'string') {
      ns = toNS(ns);
    }

    void (async (namespace: NS) => {
      const {
        ns,
        validCollectionName: isCollection,
        database,
        collection,
      } = namespace;
      const namespaceLabel = isCollection ? 'Collection' : 'Database';
      track('Screen', {
        name: isCollection ? 'drop_collection_modal' : 'drop_database_modal',
      });
      const confirmed = await showConfirmation({
        variant: 'danger',
        title: `Drop ${namespaceLabel}`,
        description: `Are you sure you want to drop ${namespaceLabel.toLocaleLowerCase()} "${ns}"?`,
        requiredInputText: isCollection ? collection : database,
        buttonText: `Drop ${namespaceLabel}`,
        'data-testid': 'drop-namespace-confirmation-modal',
      });
      if (confirmed) {
        try {
          const method = isCollection ? 'dropCollection' : 'dropDatabase';
          await dataService[method](ns);
          globalAppRegistry.emit(
            isCollection ? 'collection-dropped' : 'database-dropped',
            ns
          );
          openToast('drop-namespace-success', {
            variant: 'success',
            title: `${namespaceLabel} "${ns}" dropped`,
            timeout: 3000,
          });
        } catch (err) {
          openToast('drop-namespace-error', {
            variant: 'important',
            title: `Failed to drop ${namespaceLabel.toLocaleLowerCase()} "${ns}"`,
            description: (err as Error).message,
            timeout: 3000,
          });
        }
      }
    })(ns);
  };

  globalAppRegistry.on('open-drop-database', onDropNamespace);
  globalAppRegistry.on('open-drop-collection', onDropNamespace);

  return {
    store: {},
    deactivate() {
      globalAppRegistry.removeListener('open-drop-database', onDropNamespace);
      globalAppRegistry.removeListener('open-drop-collection', onDropNamespace);
    },
  };
}

/**
 * Drop namespace plugin doesn't render anything on it's own, but requires
 * compass-component toast and confirmation modal areas to be present
 */
export const DropNamespaceComponent: React.FunctionComponent = ({
  children,
}) => {
  return (
    <ConfirmationModalArea>
      <ToastArea>{children}</ToastArea>
    </ConfirmationModalArea>
  );
};
