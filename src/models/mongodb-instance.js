var MongoDBInstance = require('mongodb-instance-model');
var MongoDBCollection = require('./mongodb-collection');
var scoutClientMixin = require('./scout-client-mixin');
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

/**
 * Metadata for a MongoDB Instance, such as a `db.hostInfo()`, `db.listDatabases()`,
 * `db.buildInfo()`, and more.
 *
 * @see http://npm.im/mongodb-instance-model
 */
module.exports = MongoDBInstance.extend(scoutClientMixin, {
  namespace: 'MongoDBInstance',
  collections: {
    collections: MongoDBCollectionOnInstanceCollection
  },
  url: '/instance'
});
