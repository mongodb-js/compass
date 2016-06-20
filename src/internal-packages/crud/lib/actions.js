'use strict';

const Reflux = require('reflux');

const Actions = Reflux.createActions([
  'updateDocument',
  'documentUpdateSucceeded',
  'documentUpdateFailed'
]);

module.exports = Actions;
