import Reflux from 'reflux';

const configureActions = () => {
  const actions = Reflux.createActions([
    'addColumn',
    'cleanCols',
    'closeInsertDocumentDialog',
    'closeBulkUpdateDialog',
    'copyToClipboard',
    'documentRemoved',
    'drillDown',
    'elementAdded',
    'elementMarkRemoved',
    'elementRemoved',
    'elementTypeChanged',
    'getPage',
    'insertDocument',
    'insertMany',
    'toggleInsertDocumentView',
    'toggleInsertDocument',
    'openInsertDocumentDialog',
    'openBulkUpdateDialog',
    'updateBulkUpdatePreview',
    'runBulkUpdate',
    'openExportFileDialog',
    'openImportFileDialog',
    'pathChanged',
    'refreshDocuments',
    'cancelOperation',
    'removeDocument',
    'removeColumn',
    'renameColumn',
    'replaceDoc',
    'replaceDocument',
    'resetColumns',
    'updateDocument',
    'updateJsonDoc',
    'viewChanged',
    'updateComment',
  ]);

  return actions;
};

export default configureActions;
