const app = require('ampersand-app');
const Document = require('./lib/component/document');
const DocumentList = require('./lib/component/document-list');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/store/insert-document-store');
const ResetDocumentListStore = require('./lib/store/reset-document-list-store');
const LoadMoreDocumentsStore = require('./lib/store/load-more-documents-store');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('CRUD.Document', Document);
  app.appRegistry.registerComponent('CRUD.DocumentList', DocumentList);
  app.appRegistry.registerAction('CRUD.DocumentRemoved', Actions.documentRemoved);
  app.appRegistry.registerStore('CRUD.InsertDocumentStore', InsertDocumentStore);
  app.appRegistry.registerStore('CRUD.ResetDocumentListStore', ResetDocumentListStore);
  app.appRegistry.registerStore('CRUD.LoadMoreDocumentsStore', LoadMoreDocumentsStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('CRUD.Document');
  app.appRegistry.deregisterComponent('CRUD.DocumentList');
  app.appRegistry.deregisterAction('CRUD.DocumentRemoved');
  app.appRegistry.deregisterStore('CRUD.InsertDocumentStore');
  app.appRegistry.deregisterStore('CRUD.ResetDocumentListStore');
  app.appRegistry.deregisterStore('CRUD.LoadMoreDocumentsStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
