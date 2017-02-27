'use strict';

const Reflux = require('reflux');
const Actions = require('./actions');
const DataService = require('./data-service');

/**
 * The store for handling data service interactions.
 */
const DataServiceStore = Reflux.createStore({

  /**
   * Initialize the store by listening to all the actions.
   */
  init: function() {
    this.listenTo(Actions.aggregate, this.aggregate.bind(this));
    this.listenTo(Actions.buildInfo, this.buildInfo.bind(this));
    this.listenTo(Actions.connect, this.connect.bind(this));
    this.listenTo(Actions.connectionStatus, this.connectionStatus.bind(this));
    this.listenTo(Actions.count, this.count.bind(this));
    this.listenTo(Actions.createCollection, this.createCollection.bind(this));
    this.listenTo(Actions.createIndex, this.createIndex.bind(this));
    this.listenTo(Actions.currentOp, this.currentOp.bind(this));
    this.listenTo(Actions.deleteMany, this.deleteMany.bind(this));
    this.listenTo(Actions.deleteOne, this.deleteOne.bind(this));
    this.listenTo(Actions.dropCollection, this.dropCollection.bind(this));
    this.listenTo(Actions.dropDatabase, this.dropDatabase.bind(this));
    this.listenTo(Actions.dropIndex, this.dropIndex.bind(this));
    this.listenTo(Actions.explain, this.explain.bind(this));
    this.listenTo(Actions.find, this.find.bind(this));
    this.listenTo(Actions.findOneAndReplace, this.findOneAndReplace.bind(this));
    this.listenTo(Actions.getCollection, this.getCollection.bind(this));
    this.listenTo(Actions.getDatabase, this.getDatabase.bind(this));
    this.listenTo(Actions.getInstance, this.getInstance.bind(this));
    this.listenTo(Actions.hostInfo, this.hostInfo.bind(this));
    this.listenTo(Actions.insertMany, this.insertMany.bind(this));
    this.listenTo(Actions.insertOne, this.insertOne.bind(this));
    this.listenTo(Actions.listCollections, this.listCollections.bind(this));
    this.listenTo(Actions.listDatabases, this.listDatabases.bind(this));
    this.listenTo(Actions.listIndexes, this.listIndexes.bind(this));
    this.listenTo(Actions.serverStats, this.serverStats.bind(this));
    this.listenTo(Actions.top, this.top.bind(this));
    this.listenTo(Actions.updateCollection, this.updateCollection.bind(this));
    this.listenTo(Actions.updateMany, this.updateMany.bind(this));
    this.listenTo(Actions.updateOne, this.updateOne.bind(this));
    this.listenTo(Actions.usersInfo, this.usersInfo.bind(this));
  },

  /**
   * Execute an aggregation.
   *
   * @param {String} ns - The namespace.
   * @param {Array} pipeline - The pipeline.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  aggregate: function(ns, pipeline, options) {
    if (!this.dataService) {
      return Actions.aggregateComplete(this._notInitialised());
    }
    this.dataService.aggregate(ns, pipeline, options, function(error, result) {
      Actions.aggregateComplete(error, result);
    });
  },

  /**
   * Execute a buildInfo command on the current connection and
   * fires the buildInfoComplete action when results are available.
   *
   * @return {undefined|Error}
   */
  buildInfo: function() {
    if (!this.dataService) {
      return Actions.buildInfoComplete(this._notInitialised());
    }
    this.dataService.buildInfo(function(error, result) {
      Actions.buildInfoComplete(error, result);
    });
  },

  /**
   * Connect the data service store.
   *
   * @param {ConnectionModel} model - The connection model.
   */
  connect: function(model) {
    this.dataService = new DataService(model);
    this.dataService.connect((error) => {
      this.trigger(error, this.dataService);
      Actions.connectComplete(this.dataService);
    });
  },

  /**
   * Execute a connectionStatus command on the current connection and
   * fires the connectionStatusComplete action when results are available.
   *
   * @return {undefined|Error}
   */
  connectionStatus: function() {
    if (!this.dataService) {
      return Actions.connectionStatusComplete(this._notInitialised());
    }
    this.dataService.connectionStatus(function(error, result) {
      Actions.connectionStatusComplete(error, result);
    });
  },

  /**
   * Execute a count.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  count: function(ns, filter, options) {
    if (!this.dataService) {
      return Actions.countComplete(this._notInitialised());
    }
    this.dataService.count(ns, filter, options, function(error, result) {
      Actions.countComplete(error, result);
    });
  },

  /**
   * Create a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  createCollection: function(ns, options) {
    if (!this.dataService) {
      return Actions.createCollectionComplete(this._notInitialised());
    }
    this.dataService.createCollection(ns, options, function(error, result) {
      Actions.createCollectionComplete(error, result);
    });
  },

  /**
   * Create an index.
   *
   * @param {String} ns - The namespace.
   * @param {Object} spec - The index spec.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  createIndex: function(ns, spec, options) {
    if (!this.dataService) {
      return Actions.createIndexComplete(this._notInitialised());
    }
    this.dataService.createIndex(ns, spec, options, function(error, result) {
      Actions.createIndexComplete(error, result);
    });
  },

  /**
   * Execute a current op.
   *
   * @param {Boolean} includeAll - Whether to include all data.
   * @return {undefined|Error}
   */
  currentOp: function(includeAll) {
    if (!this.dataService) {
      return Actions.currentOpComplete(this._notInitialised());
    }
    this.dataService.currentOp(includeAll, function(error, result) {
      Actions.currentOpComplete(error, result);
    });
  },

  /**
   * Delete many documents.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  deleteMany: function(ns, filter, options) {
    if (!this.dataService) {
      return Actions.deleteManyComplete(this._notInitialised());
    }
    this.dataService.deleteMany(ns, filter, options, function(error, result) {
      Actions.deleteManyComplete(error, result);
    });
  },

  /**
   * Delete a single document.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  deleteOne: function(ns, filter, options) {
    if (!this.dataService) {
      return Actions.deleteOneComplete(this._notInitialised());
    }
    this.dataService.deleteOne(ns, filter, options, function(error, result) {
      Actions.deleteOneComplete(error, result);
    });
  },

  /**
   * Drop a collection.
   *
   * @param {String} ns - The namespace.
   * @return {undefined|Error}
   */
  dropCollection: function(ns) {
    if (!this.dataService) {
      return Actions.dropCollectionComplete(this._notInitialised());
    }
    this.dataService.dropCollection(ns, function(error, result) {
      Actions.dropCollectionComplete(error, result);
    });
  },

  /**
   * Drop the database.
   *
   * @param {String} name - The database name.
   * @return {undefined|Error}
   */
  dropDatabase: function(name) {
    if (!this.dataService) {
      return Actions.dropDatabaseComplete(this._notInitialised());
    }
    this.dataService.dropDatabase(name, function(error, result) {
      Actions.dropDatabaseComplete(error, result);
    });
  },

  /**
   * Drop an index.
   *
   * @param {String} ns - The namespace.
   * @param {String} name - The index name.
   * @return {undefined|Error}
   */
  dropIndex: function(ns, name) {
    if (!this.dataService) {
      return Actions.dropIndexComplete(this._notInitialised());
    }
    this.dataService.dropIndex(ns, name, function(error, result) {
      Actions.dropIndexComplete(error, result);
    });
  },

  /**
   * Execute an explain plan.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  explain: function(ns, filter, options) {
    if (!this.dataService) {
      return Actions.explainCompleteComplete(this._notInitialised());
    }
    this.dataService.explain(ns, filter, options, function(error, result) {
      Actions.explainComplete(error, result);
    });
  },

  /**
   * Find documents.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  find: function(ns, filter, options) {
    if (!this.dataService) {
      return Actions.findComplete(this._notInitialised());
    }
    this.dataService.find(ns, filter, options, function(error, result) {
      Actions.findComplete(error, result);
    });
  },

  /**
   * Find a document and replace it.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} replacement - The replacement document.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  findOneAndReplace: function(ns, filter, replacement, options) {
    if (!this.dataService) {
      return Actions.findOneAndReplaceComplete(this._notInitialised());
    }
    this.dataService.findOneAndReplace(ns, filter, replacement, options, function(error, result) {
      Actions.findOneAndReplaceComplete(error, result);
    });
  },

  /**
   * Get a collection detail.
   *
   * @param {String} ns - The namespace.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  getCollection: function(ns, options) {
    if (!this.dataService) {
      return Actions.getCollectionComplete(this._notInitialised());
    }
    this.dataService.collection(ns, options, function(error, result) {
      Actions.getCollectionComplete(error, result);
    });
  },

  /**
   * Get a database detail.
   *
   * @param {String} name - The db name.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  getDatabase: function(name, options) {
    if (!this.dataService) {
      return Actions.getDatabaseComplete(this._notInitialised());
    }
    this.dataService.database(name, options, function(error, result) {
      Actions.getDatabaseComplete(error, result);
    });
  },

  /**
   * Get the instance detail.
   *
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  getInstance: function(options) {
    if (!this.dataService) {
      return Actions.getInstanceComplete(this._notInitialised());
    }
    this.dataService.instance(options, function(error, result) {
      Actions.getInstanceComplete(error, result);
    });
  },

  /**
   * Execute a hostInfo command on the current connection and
   * fires the hostInfoComplete action when results are available.
   *
   * @return {undefined|Error}
   */
  hostInfo: function() {
    if (!this.dataService) {
      return Actions.hostInfoComplete(this._notInitialised());
    }
    this.dataService.hostInfo(function(error, result) {
      Actions.hostInfoComplete(error, result);
    });
  },

  /**
   * Insert many docs.
   *
   * @param {String} ns - The namespace.
   * @param {Array} docs - The docs to insert.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  insertMany: function(ns, docs, options) {
    if (!this.dataService) {
      return Actions.insertManyComplete(this._notInitialised());
    }
    this.dataService.insertMany(ns, docs, options, function(error, result) {
      Actions.insertManyComplete(error, result);
    });
  },

  /**
   * Insert a document.
   *
   * @param {String} ns - The namespace.
   * @param {Object} doc - The document.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  insertOne: function(ns, doc, options) {
    if (!this.dataService) {
      return Actions.insertOneComplete(this._notInitialised());
    }
    this.dataService.insertOne(ns, doc, options, function(error, result) {
      Actions.insertOneComplete(error, result);
    });
  },

  /**
   * List collections.
   *
   * @param {String} databaseName - The database name.
   * @param {Object} filter - The filter.
   * @return {undefined|Error}
   */
  listCollections: function(databaseName, filter) {
    if (!this.dataService) {
      return Actions.listCollectionsComplete(this._notInitialised());
    }
    this.dataService.listCollections(databaseName, filter, function(error, result) {
      Actions.listCollectionsComplete(error, result);
    });
  },

  /**
   * List databases on the current connection and
   * fires the listDatabasesComplete action when results are available.
   *
   * @return {undefined|Error}
   */
  listDatabases: function() {
    if (!this.dataService) {
      return Actions.listDatabasesComplete(this._notInitialised());
    }
    this.dataService.listDatabases(function(error, result) {
      Actions.listDatabasesComplete(error, result);
    });
  },

  /**
   * List indexes.
   *
   * @param {String} ns - The namespace.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  listIndexes: function(ns, options) {
    if (!this.dataService) {
      return Actions.listIndexesComplete(this._notInitialised());
    }
    this.dataService.indexes(ns, options, function(error, result) {
      Actions.listIndexesComplete(error, result);
    });
  },

  /**
   * Execute the server stats command.
   *
   * @return {undefined|Error}
   */
  serverStats: function() {
    if (!this.dataService) {
      return Actions.serverStatsComplete(this._notInitialised());
    }
    this.dataService.serverstats(function(error, result) {
      Actions.serverStatsComplete(error, result);
    });
  },

  /**
   * Execute the top command.
   *
   * @return {undefined|Error}
   */
  top: function() {
    if (!this.dataService) {
      return Actions.topComplete(this._notInitialised());
    }
    this.dataService.top(function(error, result) {
      Actions.topComplete(error, result);
    });
  },

  /**
   * Update a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} flags - The flags.
   * @return {undefined|Error}
   */
  updateCollection: function(ns, flags) {
    if (!this.dataService) {
      return Actions.updateCollectionComplete(this._notInitialised());
    }
    this.dataService.updateCollection(ns, flags, function(error, result) {
      Actions.updateCollectionComplete(error, result);
    });
  },

  /**
   * Update many documents.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} update - The update document.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  updateMany: function(ns, filter, update, options) {
    if (!this.dataService) {
      return Actions.updateManyComplete(this._notInitialised());
    }
    this.dataService.updateMany(ns, filter, update, options, function(error, result) {
      Actions.updateManyComplete(error, result);
    });
  },

  /**
   * Update one document.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} update - The update document.
   * @param {Object} options - The options.
   * @return {undefined|Error}
   */
  updateOne: function(ns, filter, update, options) {
    if (!this.dataService) {
      return Actions.updateOneComplete(this._notInitialised());
    }
    this.dataService.updateOne(ns, filter, update, options, function(error, result) {
      Actions.updateOneComplete(error, result);
    });
  },

  /**
   * Execute a usersInfo command on the authenticationDatabase and
   * fires the usersInfoComplete action when results are available.
   *
   * @param {String} authenticationDatabase - The database name.
   * @param {object} options - Options passed to NativeClient.usersInfo method.
   * @return {undefined|Error}
   */
  usersInfo: function(authenticationDatabase, options) {
    if (!this.dataService) {
      return Actions.usersInfoComplete(this._notInitialised());
    }
    this.dataService.usersInfo(authenticationDatabase, options, function(error, result) {
      Actions.usersInfoComplete(error, result);
    });
  },

  /**
   * Handle errors emitted from the data service.
   *
   * @param {Error} error - The error.
   */
  _handleError(error) {
    this.trigger(error, this.dataService);
  },

  /**
   * An error for when the data service is not initialised.
   *
   * @returns {Error} The error.
   */
  _notInitialised() {
    return new Error('Data service is not yet initialised.');
  }
});

module.exports = DataServiceStore;
