const AmpersandModel = require('ampersand-model');

const {
  Collection: MongoDbDatabaseCollection,
} = require('mongodb-database-model');

const HostInfo = AmpersandModel.extend({
  props: {
    arch: 'string',
    cpu_cores: 'number',
    cpu_frequency: 'number',
    memory_bits: 'number',
    os: 'string',
    os_family: 'string',
    kernel_version: 'string',
    kernel_version_string: 'string',
  },
});

const BuildInfo = AmpersandModel.extend({
  props: {
    isEnterprise: 'boolean',
    version: 'string',
  },
});

const GenuineMongoDB = AmpersandModel.extend({
  props: {
    isGenuine: 'boolean',
    dbType: 'string',
  },
});

const DataLake = AmpersandModel.extend({
  props: {
    isDataLake: 'boolean',
    version: 'string',
  },
});

const InstanceModel = AmpersandModel.extend({
  modelType: 'Instance',
  idAttribute: '_id',
  props: {
    _id: { type: 'string', required: true },
    hostname: { type: 'string', required: true },
    port: 'number',
    status: { type: 'string', default: 'initial' },
  },
  children: {
    host: HostInfo,
    build: BuildInfo,
    genuineMongoDB: GenuineMongoDB,
    dataLake: DataLake,
  },
  collections: {
    databases: MongoDbDatabaseCollection,
  },
  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  async fetch({ dataService }) {
    const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
    this.set({ status: newStatus });
    try {
      const instanceInfo = await dataService.instance();
      this.set({ status: 'ready', ...instanceInfo })
    } catch (err) {
      this.set({ status: 'error' });
      throw err;
    }
  },
});

module.exports = InstanceModel;
