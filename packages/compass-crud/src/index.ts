import React from 'react';
import { useStore } from 'react-redux';
import type { DocumentProps } from './components/document';
import Document from './components/document';
import type { DocumentListProps } from './components/document-list';
import DocumentList from './components/document-list';
import InsertDocumentDialog from './components/insert-document-dialog';
import {
  activateDocumentsPlugin,
  type CrudReduxStore,
} from './stores/crud-store';
import type { EmittedAppRegistryEvents } from './stores/reducer';
import { GridStoreContext } from './stores/grid-store-context';
import {
  connectionInfoRefLocator,
  connectionScopedAppRegistryLocator,
  type DataServiceLocator,
  dataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import {
  collectionModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import {
  favoriteQueryStorageAccessLocator,
  recentQueryStorageAccessLocator,
} from '@mongodb-js/my-queries-storage/provider';
import { fieldStoreServiceLocator } from '@mongodb-js/compass-field-store';
import { queryBarServiceLocator } from '@mongodb-js/compass-query-bar';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import CrudTabTitle from './plugin-title';
import type {
  RequiredDataServiceProps,
  OptionalDataServiceProps,
} from './utils/data-service';

const CompassDocumentsPluginProvider = registerCompassPlugin(
  {
    name: 'CompassDocuments',
    // The redux store carries a side-channel reference to the still-Reflux
    // grid store, we surface it via a dedicated React context so components can
    // subscribe to grid events without holding a reference to the store object.
    component: function CrudProvider({ children }) {
      const reduxStore = useStore() as unknown as CrudReduxStore;
      return React.createElement(
        GridStoreContext.Provider,
        { value: reduxStore.gridStore },
        children
      );
    },
    activate: activateDocumentsPlugin,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    dataService: dataServiceLocator as DataServiceLocator<
      RequiredDataServiceProps,
      OptionalDataServiceProps
    >,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-CRUD-UI'),
    track: telemetryLocator,
    favoriteQueryStorageAccess: favoriteQueryStorageAccessLocator,
    recentQueryStorageAccess: recentQueryStorageAccessLocator,
    fieldStoreService: fieldStoreServiceLocator,
    connectionInfoRef: connectionInfoRefLocator,
    connectionScopedAppRegistry:
      connectionScopedAppRegistryLocator<EmittedAppRegistryEvents>,
    queryBar: queryBarServiceLocator,
    collection: collectionModelLocator,
  }
);

export const CompassDocumentsPlugin = {
  name: 'Documents' as const,
  provider: CompassDocumentsPluginProvider,
  content: DocumentList,
  header: CrudTabTitle,
};

export default DocumentList;
export type { DocumentListProps, DocumentProps };
export { DocumentList, Document, InsertDocumentDialog };
export type { DocumentListViewProps } from './components/document-list-view';
export { default as DocumentListView } from './components/document-list-view';
export type { DocumentJsonViewProps } from './components/document-json-view';
export { default as DocumentJsonView } from './components/document-json-view';
