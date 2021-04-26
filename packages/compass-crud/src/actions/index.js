import Reflux from 'reflux';

const configureActions = () => {
  const actions = Reflux.createActions([
    'addColumn',
    'cleanCols',
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
    'insertMany',
    'toggleInsertDocumentView',
    'toggleInsertDocument',
    'openInsertDocumentDialog',
    'openExportFileDialog',
    'openImportFileDialog',
    'pathChanged',
    'refreshDocuments',
    'removeDocument',
    'removeColumn',
    'renameColumn',
    'replaceDoc',
    'replaceDocument',
    'replaceExtJsonDocument',
    'resetHeaders',
    'updateDocument',
    'clearUpdateStatus',
    'updateJsonDoc',
    'viewChanged',
    'updateComment'
  ]);

  return actions;
};

export default configureActions;
