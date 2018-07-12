var MongoDBInstance = require('mongodb-instance-model');
var MongoDBCollection = require('./mongodb-collection');
var BaseDatabaseModel = require('mongodb-database-model');
var BaseDatabaseCollection = require('mongodb-database-model').Collection;
var clientMixin = require('./mongodb-scope-client-mixin');
var filterableMixin = require('ampersand-collection-filterable');
var selectableMixin = require('./selectable-collection-mixin');
var toNS = require('mongodb-ns');

/**
 * A user selectable collection of `MongoDBCollection`'s with `specialish`
  * collections filtered out.
 */
var MongoDBCollectionOnInstanceCollection = MongoDBCollection.Collection.extend({
  namespace: 'MongoDBCollectionOnInstanceCollection',
  model: MongoDBCollection,
  parse: function(res) {
    return res.filter(function(d) {
      return !toNS(d._id).system;
    });
  }
}, filterableMixin, selectableMixin);

var DatabaseModel = BaseDatabaseModel.extend({
  collections: {
    collections: MongoDBCollectionOnInstanceCollection
  }
});

var DatabaseCollection = BaseDatabaseCollection.extend({
  model: DatabaseModel
}, filterableMixin);

/**
 * Metadata for a MongoDB Instance, such as a `db.hostInfo()`, `db.listDatabases()`,
 * `db.buildInfo()`, and more.
 *
 * @see http://npm.im/mongodb-instance-model
 */
module.exports = MongoDBInstance.extend(clientMixin, {
  namespace: 'MongoDBInstance',
  collections: {
    databases: DatabaseCollection,
    collections: MongoDBCollectionOnInstanceCollection
  },
  url: '/instance'
});
