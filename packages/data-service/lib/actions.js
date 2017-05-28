'use strict';

const Reflux = require('reflux');

/**
 * The actions that are handled by the data service.
 */
const Actions = Reflux.createActions([
  'connect',
  'topologyDescriptionChanged'
]);

module.exports = Actions;
