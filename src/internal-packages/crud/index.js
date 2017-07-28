const app = require('hadron-app');
const Document = require('./lib/component/document');
const DocumentList = require('./lib/component/document-list');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/store/insert-document-store');
const ResetDocumentListStore = require('./lib/store/reset-document-list-store');
const LoadMoreDocumentsStore = require('./lib/store/load-more-documents-store');
const {
  StandardEditor,
  DateEditor,
  StringEditor,
  Int32Editor,
  DoubleEditor,
  NullEditor,
  UndefinedEditor,
  ObjectIDEditor
} = require('./lib/component/editor');

const COLLECTION_TAB_ROLE = {
  component: DocumentList,
  name: 'DOCUMENTS',
  hasQueryHistory: true,
  order: 1
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
  component: ObjectIDEditor
};

/**
 * Activate all the components in the CRUD package.
 */
function activate(appRegistry) {
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
  appRegistry.registerStore('CRUD.InsertDocumentStore', InsertDocumentStore);
  appRegistry.registerStore('CRUD.ResetDocumentListStore', ResetDocumentListStore);
  appRegistry.registerStore('CRUD.LoadMoreDocumentsStore', LoadMoreDocumentsStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterRole('CRUD.Document', DOCUMENT_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Standard', STANDARD_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Date', DATE_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Double', DOUBLE_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.String', STRING_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Int32', INT32_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Null', NULL_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Undefined', UNDEFINED_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.ObjectID', OBJECT_ID_EDITOR_ROLE);
  app.appRegistry.deregisterAction('CRUD.Actions');
  app.appRegistry.deregisterStore('CRUD.InsertDocumentStore');
  app.appRegistry.deregisterStore('CRUD.ResetDocumentListStore');
  app.appRegistry.deregisterStore('CRUD.LoadMoreDocumentsStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
