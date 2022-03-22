import { ElementEditor } from 'hadron-document';
import Document from './components/document';
import DocumentList from './components/document-list';
import InsertDocumentDialog from './components/insert-document-dialog';
import ConnectedDocumentList from './components/connected-document-list';
import configureActions from './actions';
import configureStore from './stores/crud-store';

const {
  StandardEditor,
  DateEditor,
  StringEditor,
  Int32Editor,
  DoubleEditor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor
} = ElementEditor;

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

const STANDARD_EDITOR_ROLE = {
  component: StandardEditor
};

const DATE_EDITOR_ROLE = {
  component: DateEditor
};

const DOUBLE_EDITOR_ROLE = {
  component: DoubleEditor
};

const STRING_EDITOR_ROLE = {
  component: StringEditor
};

const INT32_EDITOR_ROLE = {
  component: Int32Editor
};

const NULL_EDITOR_ROLE = {
  component: NullEditor
};

const UNDEFINED_EDITOR_ROLE = {
  component: UndefinedEditor
};

const OBJECT_ID_EDITOR_ROLE = {
  component: ObjectIdEditor
};

/**
 * Activate all the components in the CRUD package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
const activate = (appRegistry) => {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.registerRole('CRUD.Document', DOCUMENT_ROLE);
  appRegistry.registerRole('CRUD.Editor.Standard', STANDARD_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.Date', DATE_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.Double', DOUBLE_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.String', STRING_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.Int32', INT32_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.Null', NULL_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.Undefined', UNDEFINED_EDITOR_ROLE);
  appRegistry.registerRole('CRUD.Editor.ObjectID', OBJECT_ID_EDITOR_ROLE);
};

/**
 * Deactivate all the components in the CRUD package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
const deactivate = (appRegistry) => {
  appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.deregisterRole('CRUD.Document', DOCUMENT_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.Standard', STANDARD_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.Date', DATE_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.Double', DOUBLE_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.String', STRING_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.Int32', INT32_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.Null', NULL_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.Undefined', UNDEFINED_EDITOR_ROLE);
  appRegistry.deregisterRole('CRUD.Editor.ObjectID', OBJECT_ID_EDITOR_ROLE);
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
export { default as metadata } from '../package.json';
