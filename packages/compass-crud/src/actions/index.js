import Reflux from 'reflux';

const Actions = Reflux.createActions([
  'addColumn',
  'cleanCols',
  'closeAllMenus',
  'closeInsertDocumentDialog',
  'copyToClipboard',
  'documentRemoved',
  'drillDown',
  'elementAdded',
  'elementMarkRemoved',
  'elementRemoved',
  'elementTypeChanged',
  'getNextPage',
  'getPrevPage',
  'insertDocument',
  'openInsertDocumentDialog',
  'pathChanged',
  'refreshDocuments',
  'openImport',
  'openExport',
  'removeDocument',
  'removeColumn',
  'renameColumn',
  'replaceDoc',
  'resetHeaders',
  'updateDocument',
  'viewChanged'
]);

export default Actions;
