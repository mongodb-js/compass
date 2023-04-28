import type AppRegistry from 'hadron-app-registry';

import Document, { DocumentProps } from './components/document';
import DocumentList, { DocumentListProps } from './components/document-list';
import InsertDocumentDialog from './components/insert-document-dialog';
import { ConnectedDocumentList } from './components/connected-document-list';
import configureActions from './actions';
import configureStore from './stores/crud-store';

const COLLECTION_TAB_ROLE = {
  component: ConnectedDocumentList,
  name: 'Documents',
  order: 1,
  configureStore: configureStore,
  storeName: 'CRUD.Store',
  configureActions: configureActions,
  actionName: 'CRUD.Actions',
};

/**
 * Activate all the components in the CRUD package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
const activate = (appRegistry: AppRegistry): void => {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
};

/**
 * Deactivate all the components in the CRUD package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
const deactivate = (appRegistry: AppRegistry): void => {
  appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
};

export default DocumentList;
export {
  activate,
  deactivate,
  DocumentList,
  DocumentListProps,
  Document,
  DocumentProps,
  InsertDocumentDialog,
  configureStore,
  configureActions,
};
export {
  default as DocumentListView,
  DocumentListViewProps,
} from './components/document-list-view';
export {
  default as DocumentJsonView,
  DocumentJsonViewProps,
} from './components/document-json-view';
export { default as metadata } from '../package.json';
