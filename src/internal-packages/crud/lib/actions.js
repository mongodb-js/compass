const fs = require('fs');
const Reflux = require('reflux');
const debug = require('debug')('mongodb-compass:crud:actions');

const Actions = Reflux.createActions([
  'documentRemoved',
  'openInsertDocumentDialog',
  'insertDocument',
  'fileDropped'
]);

document.ondragover = document.ondrop = (ev) => {
  ev.preventDefault();
};

document.body.ondrop = (ev) => {
  ev.preventDefault();
  const file = ev.dataTransfer.files[0].path;
  fs.readFile(file, 'utf-8', (error, data) => {
    if (error) {
      debug(`Error opening file '${file}': ${error.message}`);
    }
    try {
      Actions.openInsertDocumentDialog(JSON.parse(data), false);
    } catch (e) {
      debug(`File ${file} is not a single parseable JSON document: ${e.message}`);
    }
  });
};

module.exports = Actions;
