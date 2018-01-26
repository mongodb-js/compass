const fs = require('fs');
const Reflux = require('reflux');
const debug = require('debug')('mongodb-compass:crud:actions');

const Actions = Reflux.createActions([
  'addColumn',
  'cleanCols',
  'closeAllMenus',
  'closeInsertDocumentDialog',
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

document.ondragover = document.ondrop = (ev) => {
  ev.preventDefault();
};

document.body.ondrop = (ev) => {
  ev.preventDefault();
  const file = ev.dataTransfer.files[0];
  if (file) {
    const path = file.path;
    fs.readFile(path, 'utf-8', (error, data) => {
      if (error) {
        debug(`Error opening file '${path}': ${error.message}`);
      }
      try {
        Actions.openInsertDocumentDialog(JSON.parse(data), false);
      } catch (e) {
        debug(`File ${path} is not a single parseable JSON document: ${e.message}`);
      }
    });
  }
};

module.exports = Actions;
