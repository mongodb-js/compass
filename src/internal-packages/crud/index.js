'use strict';

const app = require('ampersand-app');
const DocumentList = require('./lib/component/document-list');
const Document = require('./lib/component/document');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/store/insert-document-store');
const ResetDocumentListStore = require('./lib/store/reset-document-list-store');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('Component::CRUD::DocumentList', DocumentList);
  app.appRegistry.registerComponent('Component::CRUD::Document', Document);
  app.appRegistry.registerAction('Action::CRUD::DocumentRemoved', Actions.documentRemoved);
  app.appRegistry.registerStore('Store::CRUD::InsertDocumentStore', InsertDocumentStore);
  app.appRegistry.registerStore('Store::CRUD::ResetDocumentListStore', ResetDocumentListStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Component::CRUD::DocumentList');
  app.appRegistry.deregisterComponent('Component::CRUD::Document');
  app.appRegistry.deregisterAction('Action::CRUD::DocumentRemoved');
  app.appRegistry.deregisterStore('Store::CRUD::InsertDocumentStore');
  app.appRegistry.deregisterStore('Store::CRUD::ResetDocumentListStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
