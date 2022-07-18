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
    'getPage',
    'insertDocument',
    'insertMany',
    'toggleInsertDocumentView',
    'toggleInsertDocument',
    'openInsertDocumentDialog',
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
    'resetHeaders',
    'updateDocument',
    'updateJsonDoc',
    'viewChanged',
    'updateComment',
  ]);

  return actions;
};

export default configureActions;
