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
} from 'mongodb-data-service/provider';
import type {
  DataService,
  OptionalDataServiceProps,
  RequiredDataServiceProps,
} from './utils/data-service';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

const activate = () => {
  // noop
};

const deactivate = () => {
  // noop
};

export const CompassDocumentsHadronPlugin = registerHadronPlugin<
  CollectionTabPluginMetadata,
  {
    dataService: () => DataService;
    instance: () => MongoDBInstance;
    preferences: () => PreferencesAccess;
  }
>(
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
  }
);

export const CompassDocumentsPlugin = {
  name: 'Documents',
  component: CompassDocumentsHadronPlugin,
};

export default DocumentList;
export type { DocumentListProps, DocumentProps };
export { activate, deactivate, DocumentList, Document, InsertDocumentDialog };
export type { DocumentListViewProps } from './components/document-list-view';
export { default as DocumentListView } from './components/document-list-view';
export type { DocumentJsonViewProps } from './components/document-json-view';
export { default as DocumentJsonView } from './components/document-json-view';
export { default as metadata } from '../package.json';
