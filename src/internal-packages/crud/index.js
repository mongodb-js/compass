'use strict';

const app = require('ampersand-app');
const DocumentList = require('./lib/component/document-list');

const DocumentListItem = DocumentList.DocumentListItem;
const ArrayElement = DocumentListItem.ArrayElement;
const DateElement = DocumentListItem.DateElement;
const ObjectElement = DocumentListItem.ObjectElement;
const StringElement = DocumentListItem.StringElement;

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.componentRegistry.register(DocumentList, { role: 'Collection:DocumentList' });
  app.componentRegistry.register(ArrayElement, { role: 'DocumentListItem:Type:Array' });
  app.componentRegistry.register(DateElement, { role: 'DocumentListItem:Type:Date' });
  app.componentRegistry.register(ObjectElement, { role: 'DocumentListItem:Type:Object' });
  app.componentRegistry.register(StringElement, { role: 'DocumentListItem:Type:String' });
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.componentRegistry.deregister(DocumentList);
  app.componentRegistry.deregister(ArrayElement);
  app.componentRegistry.deregister(DateElement);
  app.componentRegistry.deregister(ObjectElement);
  app.componentRegistry.deregister(StringElement);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
