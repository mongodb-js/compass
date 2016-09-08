'use strict';

const _ = require('lodash');
const Reflux = require('reflux');
const Action = require('../action/index-actions');
const shell = require('electron').shell;

const HELP_URLS = {
  SINGLE: 'https://docs.mongodb.org/manual/core/index-single/',
  COMPOUND: 'https://docs.mongodb.org/manual/core/index-compound/',
  UNIQUE: 'https://docs.mongodb.org/manual/core/index-unique/',
  PARTIAL: 'https://docs.mongodb.org/manual/core/index-partial/',
  SPARSE: 'https://docs.mongodb.org/manual/core/index-sparse/',
  TTL: 'https://docs.mongodb.org/manual/core/index-ttl/',
  '2D': 'https://docs.mongodb.org/manual/core/2d/',
  '2DSPHERE': 'https://docs.mongodb.org/manual/core/2dsphere/',
  GEOHAYSTACK: 'https://docs.mongodb.org/manual/core/geohaystack/',
  GEOSPATIAL: 'https://docs.mongodb.org/manual/applications/geospatial-indexes/#geospatial-indexes',
  TEXT: 'https://docs.mongodb.org/manual/core/index-text/',
  HASHED: 'https://docs.mongodb.org/manual/core/index-hashed/',
  REGULAR: 'https://docs.mongodb.com/manual/indexes/#single-field',
  UNKNOWN: null
};

/**
 * The reflux store for getting index help.
 */
const IndexHelpStore = Reflux.createStore({

  /**
   * Initialize the index help store.
   */
  init: function() {
    this.listenTo(Action.indexHelp, this.indexHelp);
  },

  /**
   * Open the index help link.
   */
  indexHelp: function(section) {
    var url = _.get(HELP_URLS, section, 'UNKNOWN');
    if (url) {
      shell.openExternal(url);
      this.trigger();
    }
  }
});

module.exports = IndexHelpStore;
