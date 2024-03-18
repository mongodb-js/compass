import type { DocumentProps } from './components/document';
import Document from './components/document';
import type { DocumentListProps } from './components/document-list';
import DocumentList from './components/document-list';
import InsertDocumentDialog from './components/insert-document-dialog';
import { DocumentListWithReadonly } from './components/connected-document-list';
import { activateDocumentsPlugin } from './stores/crud-store';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import type {
  OptionalDataServiceProps,
  RequiredDataServiceProps,
} from './utils/data-service';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import {
  favoriteQueryStorageAccessLocator,
  recentQueryStorageAccessLocator,
} from '@mongodb-js/my-queries-storage/provider';

export const CompassDocumentsHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassDocuments',
    component: DocumentListWithReadonly as any, // as any because of reflux store
    activate: activateDocumentsPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      RequiredDataServiceProps,
      OptionalDataServiceProps
    >,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-CRUD-UI'),
    favoriteQueryStorageAccess: favoriteQueryStorageAccessLocator,
    recentQueryStorageAccess: recentQueryStorageAccessLocator,
  }
);

export const CompassDocumentsPlugin = {
  name: 'Documents',
  component: CompassDocumentsHadronPlugin,
};

export default DocumentList;
export type { DocumentListProps, DocumentProps };
export { DocumentList, Document, InsertDocumentDialog };
export type { DocumentListViewProps } from './components/document-list-view';
export { default as DocumentListView } from './components/document-list-view';
export type { DocumentJsonViewProps } from './components/document-json-view';
export { default as DocumentJsonView } from './components/document-json-view';
