'use strict';

const app = require('ampersand-app');
const DocumentList = require('./lib/component/document-list');
const Actions = require('./lib/actions');
const InsertDocumentStore = require('./lib/store/insert-document-store');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('Component::CRUD::DocumentList', DocumentList);
  app.appRegistry.registerAction('Action::CRUD::DocumentRemoved', Actions.documentRemoved);
  app.appRegistry.registerStore('Store::CRUD::InsertDocumentStore', InsertDocumentStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Component::CRUD::DocumentList');
  app.appRegistry.deregisterAction('Action::CRUD::DocumentRemoved');
  app.appRegistry.deregisterStore('Store::CRUD::InsertDocumentStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
