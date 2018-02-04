import Document from 'components/document';
import DocumentList from 'components/document-list';
import InsertDocumentDialog from 'components/insert-document-dialog';

import {
  StandardEditor,
  DateEditor,
  StringEditor,
  Int32Editor,
  DoubleEditor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor
} from 'components/editor';

let COLLECTION_TAB_ROLE;

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
  const ConnectedDocumentList = require('components/connected-document-list').default;
  const Actions = require('actions').default;
  const CRUDStore = require('stores/crud-store').default;

  COLLECTION_TAB_ROLE = {
    component: ConnectedDocumentList,
    name: 'Documents',
    hasQueryHistory: true,
    order: 1
  };

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
  appRegistry.registerAction('CRUD.Actions', Actions);
  appRegistry.registerStore('CRUD.Store', CRUDStore);
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
  appRegistry.deregisterAction('CRUD.Actions');
  appRegistry.deregisterStore('CRUD.Store');
};

export default DocumentList;
export { activate, deactivate, DocumentList, Document, InsertDocumentDialog };
