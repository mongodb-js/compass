'use strict';

const Reflux = require('reflux');

const IndexActions = Reflux.createActions([ 'loadIndexes', 'sortIndexes', 'indexHelp' ]);

module.exports = IndexActions;
