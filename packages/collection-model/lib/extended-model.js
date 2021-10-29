const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-collection');
const { promisify } = require('util');
const toNs = require('mongodb-ns');

const CollectionModel = AmpersandModel.extend({
  modelType: 'Collection',
  idAttribute: '_id',
  props: {
    _id: 'string',

    // Normalized values from listCollections command
    name: { type: 'string', required: true },
    database: { type: 'string', required: true },
    type: { type: 'string', required: true },
    system: { type: 'boolean', required: true },
    oplog: { type: 'boolean', required: true },
    command: { type: 'boolean', required: true },
    special: { type: 'boolean', required: true },
    specialish: { type: 'boolean', required: true },
    normal: { type: 'boolean', required: true },
    readonly: 'boolean',
    collation: 'object',
    pipeline: 'array',
    validation: 'object',

    // Normalized values from collStats command
    ns: 'string',
    is_capped: 'boolean',
    max: 'number',
    is_power_of_two: 'boolean',
    index_sizes: 'object',
    document_count: 'number',
    document_size: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
    padding_factor: 'number',
    extent_count: 'number',
    extent_last_size: 'number',
    flags_user: 'number',
    max_document_size: 'number',
    size: 'number',
    index_details: 'object',
    wired_tiger: 'object',
  },
  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  async fetch({ dataService }) {
    const collectionStatsAsync = promisify(
      dataService.collectionStats.bind(dataService)
    );
    const collectionInfoAsync = promisify(
      dataService.collectionInfo.bind(dataService)
    );
    const [collStats, collectionInfo] = await Promise.all([
      collectionStatsAsync(this.getId()),
      collectionInfoAsync(this.database, this.name),
    ]);
    return this.set({ ...collStats, ...collectionInfo });
  },
});

const CollectionCollection = AmpersandCollection.extend({
  modelType: 'CollectionCollection',
  mainIndex: '_id',
  indexes: ['name'],
  comparator: '_id',
  model: CollectionModel,
  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  fetch({ dataService }) {
    return new Promise((resolve, reject) => {
      const databaseName = this.parent && this.parent.getId();

      if (!databaseName) {
        throw new Error(
          "Trying to fetch MongoDBCollectionCollection that doesn't have the parent model"
        );
      }

      dataService.listCollectionsNamesOnly(databaseName, (err, collections) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(
          this.set(
            collections.filter((coll) => {
              // TODO: This is not the best place to do this kind of
              // filtering, but for now this preserves the current behavior
              // and changing it right away will expand the scope of the
              // refactor significantly. We can address this in COMPASS-5211
              return toNs(`${databaseName}.${coll.name}`).system === false;
            })
          )
        );
      });
    });
  },
});

module.exports = CollectionModel;
module.exports.Collection = CollectionCollection;
