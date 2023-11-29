import type { DocumentProps } from './components/document';
import Document from './components/document';
import type { DocumentListProps } from './components/document-list';
import DocumentList from './components/document-list';
import InsertDocumentDialog from './components/insert-document-dialog';
import { ConnectedDocumentList } from './components/connected-document-list';
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

const activate = () => {
  // noop
};

const deactivate = () => {
  // noop
};

export const CompassDocumentsHadronPlugin = registerHadronPlugin<
  CollectionTabPluginMetadata,
  { dataService: () => DataService; instance: () => MongoDBInstance }
>(
  {
    name: 'CompassDocuments',
    component: ConnectedDocumentList as any, // as any because of reflux store
    activate: activateDocumentsPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      RequiredDataServiceProps,
      OptionalDataServiceProps
    >,
    instance: mongoDBInstanceLocator,
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
