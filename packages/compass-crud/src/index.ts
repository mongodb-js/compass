import type AppRegistry from 'hadron-app-registry';

import Document from './components/document';
import DocumentList from './components/document-list';
import InsertDocumentDialog from './components/insert-document-dialog';
import ConnectedDocumentList from './components/connected-document-list';
import configureActions from './actions';
import configureStore from './stores/crud-store';

const COLLECTION_TAB_ROLE = {
  component: ConnectedDocumentList,
  name: 'Documents',
  hasQueryHistory: true,
  order: 1,
  configureStore: configureStore,
  storeName: 'CRUD.Store',
  configureActions: configureActions,
  actionName: 'CRUD.Actions'
};

const DOCUMENT_ROLE = {
  component: Document,
  name: 'STANDARD',
  order: 1
};

/**
 * Activate all the components in the CRUD package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
const activate = (appRegistry: AppRegistry): void => {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.registerRole('CRUD.Document', DOCUMENT_ROLE);
};

/**
 * Deactivate all the components in the CRUD package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
const deactivate = (appRegistry: AppRegistry): void => {
  appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.deregisterRole('CRUD.Document', DOCUMENT_ROLE);
};

export default DocumentList;
export {
  activate,
  deactivate,
  DocumentList,
  Document,
  InsertDocumentDialog,
  configureStore,
  configureActions
};
export { default as DocumentListView } from './components/document-list-view';
export { default as DocumentJsonView } from './components/document-json-view';
export { default as metadata } from '../package.json';
