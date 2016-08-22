'use strict';

const app = require('ampersand-app');
const DocumentList = require('./lib/component/document-list');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/store/insert-document-store');
const ResetDocumentListStore = require('./lib/store/reset-document-list-store');
const LoadMoreDocumentsStore = require('./lib/store/load-more-documents-store');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('Component::CRUD::DocumentList', DocumentList);
  app.appRegistry.registerAction('Action::CRUD::DocumentRemoved', Actions.documentRemoved);
  app.appRegistry.registerStore('Store::CRUD::InsertDocumentStore', InsertDocumentStore);
  app.appRegistry.registerStore('Store::CRUD::ResetDocumentListStore', ResetDocumentListStore);
  app.appRegistry.registerStore('Store::CRUD::LoadMoreDocumentsStore', LoadMoreDocumentsStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Component::CRUD::DocumentList');
  app.appRegistry.deregisterAction('Action::CRUD::DocumentRemoved');
  app.appRegistry.deregisterStore('Store::CRUD::InsertDocumentStore');
  app.appRegistry.deregisterStore('Store::CRUD::ResetDocumentListStore');
  app.appRegistry.deregisterStore('Store::CRUD::LoadMoreDocumentsStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
