const app = require('hadron-app');
const Document = require('./lib/component/document');
const DocumentList = require('./lib/component/document-list');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/store/insert-document-store');
const ResetDocumentListStore = require('./lib/store/reset-document-list-store');
const LoadMoreDocumentsStore = require('./lib/store/load-more-documents-store');
const StandardEditor = require('./lib/component/editor/standard');
const DateEditor = require('./lib/component/editor/date');

/**
 * The collection tab role for the document list component.
 */
const COLLECTION_TAB_ROLE = {
  component: DocumentList,
  name: 'DOCUMENTS',
  order: 2
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


/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.registerRole('CRUD.Document', DOCUMENT_ROLE);
  app.appRegistry.registerRole('CRUD.Editor.Standard', STANDARD_EDITOR_ROLE);
  app.appRegistry.registerRole('CRUD.Editor.Date', DATE_EDITOR_ROLE);
  app.appRegistry.registerAction('CRUD.Actions', Actions);
  app.appRegistry.registerStore('CRUD.InsertDocumentStore', InsertDocumentStore);
  app.appRegistry.registerStore('CRUD.ResetDocumentListStore', ResetDocumentListStore);
  app.appRegistry.registerStore('CRUD.LoadMoreDocumentsStore', LoadMoreDocumentsStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterRole('CRUD.Document', DOCUMENT_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Standard', STANDARD_EDITOR_ROLE);
  app.appRegistry.deregisterRole('CRUD.Editor.Date', DATE_EDITOR_ROLE);
  app.appRegistry.deregisterAction('CRUD.Actions');
  app.appRegistry.deregisterStore('CRUD.InsertDocumentStore');
  app.appRegistry.deregisterStore('CRUD.ResetDocumentListStore');
  app.appRegistry.deregisterStore('CRUD.LoadMoreDocumentsStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
