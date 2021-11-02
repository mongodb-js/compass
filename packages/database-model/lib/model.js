const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-collection');
const {
  Collection: MongoDbCollectionCollection,
} = require('mongodb-collection-model');

const DatabaseModel = AmpersandModel.extend({
  modelType: 'Database',
  idAttribute: '_id',
  props: {
    _id: 'string',
    name: 'string',
    document_count: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
  },
  collections: {
    collections: MongoDbCollectionCollection,
  },
  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  async fetch({ dataService }) {
    const stats = await dataService.databaseStats(this.getId());
    return this.set(stats);
  }
});

const DatabaseCollection = AmpersandCollection.extend({
  modelType: 'DatabaseCollection',
  mainIndex: '_id',
  indexes: ['name'],
  comparator: '_id',
  model: DatabaseModel,
  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  fetch({ dataService }) {
    return new Promise((resolve, reject) => {
      dataService.listDatabases({ nameOnly: true }, (err, databases) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.set(databases));
      });
    });
  }
});

module.exports = DatabaseModel;
module.exports.Collection = DatabaseCollection;
