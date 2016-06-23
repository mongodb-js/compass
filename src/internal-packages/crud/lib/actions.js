'use strict';

const Reflux = require('reflux');

const Actions = Reflux.createActions([
  'documentRemoved',
  'openInsertDocumentDialog',
  'insertDocument'
]);

module.exports = Actions;
