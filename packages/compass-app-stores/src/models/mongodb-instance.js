import MongoDBInstance from 'mongodb-instance-model';
import MongoDBCollection from './mongodb-collection';
import BaseDatabaseModel from 'mongodb-database-model';
import MongoDBDatabase from 'mongodb-database-model';
const BaseDatabaseCollection = MongoDBDatabase.Collection;
import clientMixin from './mongodb-scope-client-mixin';
import filterableMixin from 'ampersand-collection-filterable';
import selectableMixin from './selectable-collection-mixin';
import toNS from 'mongodb-ns';

/**
 * A user selectable collection of `MongoDBCollection`'s with `specialish`
  * collections filtered out.
 */
const MongoDBCollectionOnInstanceCollection = MongoDBCollection.Collection.extend({
  namespace: 'MongoDBCollectionOnInstanceCollection',
  model: MongoDBCollection,
  parse: function(res) {
    return res.filter(function(d) {
      return !toNS(d._id).system;
    });
  }
}, filterableMixin, selectableMixin);

const DatabaseModel = BaseDatabaseModel.extend({
  collections: {
    collections: MongoDBCollectionOnInstanceCollection
  }
});

const DatabaseCollection = BaseDatabaseCollection.extend({
  model: DatabaseModel
}, filterableMixin);

/**
 * Metadata for a MongoDB Instance, such as a `db.hostInfo()`, `db.listDatabases()`,
 * `db.buildInfo()`, and more.
 *
 * @see http://npm.im/mongodb-instance-model
 */
export default MongoDBInstance.extend(clientMixin, {
  namespace: 'MongoDBInstance',
  collections: {
    databases: DatabaseCollection,
    collections: MongoDBCollectionOnInstanceCollection
  },
  url: '/instance'
});
