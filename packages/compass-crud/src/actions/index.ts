import Reflux from 'reflux';

const configureActions = () => {
  const actions = Reflux.createActions([
    'addColumn',
    'cleanCols',
    'closeInsertDocumentDialog',
    'closeBulkUpdateModal',
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
    'openBulkUpdateModal',
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
    'updateMaxDocumentsPerPage',
  ]);

  return actions;
};

export default configureActions;
