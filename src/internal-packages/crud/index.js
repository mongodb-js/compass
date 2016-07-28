'use strict';

const app = require('ampersand-app');
const DocumentList = require('./lib/component/document-list');
const Actions = require('./lib/actions');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('Component::CRUD::DocumentList', DocumentList);
  app.appRegistry.registerAction('Action::CRUD::DocumentRemoved', Actions.documentRemoved);
  app.appRegistry.registerAction('Action::CRUD::InsertDocument', Actions.insertDocument);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Component::CRUD::DocumentList');
  app.appRegistry.deregisterAction('Action::CRUD::DocumentRemoved');
  app.appRegistry.deregisterAction('Action::CRUD::InsertDocument');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
