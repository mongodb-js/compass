const fs = require('fs');
const Reflux = require('reflux');
const debug = require('debug')('mongodb-compass:crud:actions');

const Actions = Reflux.createActions([
  'documentRemoved',
  'openInsertDocumentDialog',
  'closeInsertDocumentDialog',
  'insertDocument',
  'fileDropped',
  'refreshDocuments',
  'closeAllMenus',
  'fetchNextDocuments',
  'elementInvalid',
  'elementValid',
  'addColumn',
  'removeColumn',
  'cleanCols',
  'resetHeaders',
  'elementAdded',
  'elementRemoved',
  'elementMarkRemoved',
  'elementTypeChanged',
  'getNextPage',
  'getPrevPage',
  'pathChanged',
  'drillDown'
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
