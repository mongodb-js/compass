'use strict';

const app = require('ampersand-app');
const DocumentList = require('./lib/component/document-list');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.componentRegistry.register(DocumentList, { role: 'Collection:DocumentList' });
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.componentRegistry.deregister(DocumentList);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
