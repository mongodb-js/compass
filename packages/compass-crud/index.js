const Document = require('./lib/components/document');
const DocumentList = require('./lib/components/document-list');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/stores/insert-document-store');
const ResetDocumentListStore = require('./lib/stores/reset-document-list-store');
const LoadMoreDocumentsStore = require('./lib/stores/load-more-documents-store');
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
function deactivate(appRegistry) {
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
  appRegistry.deregisterStore('CRUD.InsertDocumentStore');
  appRegistry.deregisterStore('CRUD.ResetDocumentListStore');
  appRegistry.deregisterStore('CRUD.LoadMoreDocumentsStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
