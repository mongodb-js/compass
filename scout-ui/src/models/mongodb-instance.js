var MongoDBInstance = require('../../../scout-brain').models.Instance;
var MongoDBCollectionCollection = require('../../../scout-brain').models.CollectionCollection;
var MongoDBCollection = require('./mongodb-collection');
var scoutClientMixin = require('./scout-client-mixin');
var selectableMixin = require('./selectable-collection-mixin');
var types = require('./types');

/**
 * A user selectable collection of `MongoDBCollection`'s with `specialish`
  * collections filtered out.
 */
var MongoDBCollectionOnInstanceCollection = MongoDBCollectionCollection.extend(selectableMixin, {
  namespace: 'MongoDBCollectionOnInstanceCollection',
  model: MongoDBCollection,
  parse: function(res) {
    return res.filter(function(d) {
      return !types.ns(d._id).specialish;
    });
  }
});

/**
 * Metadata for a MongoDB Instance, such as a `db.hostInfo()`, `db.listDatabases()`,
 * `db.buildInfo()`, and more.
 * @see https://github.com/10gen/scout/blob/dev/scout-brain/lib/models/instance.js
 */
module.exports = MongoDBInstance.extend(scoutClientMixin, {
  namespace: 'MongoDBInstance',
  children: {
    collections: MongoDBCollectionOnInstanceCollection
  },
  scout: function() {
    return this.client.instance.bind(this.client);
  }
});
