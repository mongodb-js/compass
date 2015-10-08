var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var AmpersandState = require('ampersand-state');
var DatabaseCollection = require('mongodb-database-model').Collection;
var CollectionCollection = require('mongodb-collection-model').Collection;
var hostname = require('os').hostname();

var HostInfo = AmpersandState.extend({
  props: {
    system_time: 'date',
    hostname: 'string',
    os: 'string',
    os_family: 'string',
    kernel_version: 'string',
    kernel_version_string: 'string',
    memory_bits: 'number',
    memory_page_size: 'number',
    arch: 'string',
    cpu_cores: 'number',
    cpu_cores_physical: 'number',
    cpu_scheduler: 'string',
    cpu_frequency: 'number',
    cpu_string: 'string',
    cpu_bits: 'number',
    machine_model: 'string',
    feature_numa: 'boolean',
    feature_always_full_sync: 'number',
    feature_nfs_async: 'number'
  }
});

var BuildInfo = AmpersandState.extend({
  props: {
    version: 'string',
    commit: 'string',
    commit_url: 'string',
    flags_loader: 'string',
    flags_compiler: 'string',
    allocator: 'string',
    javascript_engine: 'string',
    debug: 'boolean',
    for_bits: 'number',
    max_bson_object_size: 'number',
    enterprise_module: 'boolean'
  }
});

var Instance = AmpersandModel.extend({
  modelType: 'Instance',
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string'
    }
  },
  collections: {
    databases: DatabaseCollection,
    collections: CollectionCollection
  },
  children: {
    host: HostInfo,
    build: BuildInfo
  }
});

var InstanceCollection = AmpersandCollection.extend({
  comparator: '_id',
  model: Instance,
  modelType: 'InstanceCollection'
});

module.exports = Instance;
module.exports.Collection = InstanceCollection;
module.exports.BuildInfo = BuildInfo;
module.exports.HostInfo = HostInfo;

module.exports.getId = function(id) {
  if (typeof id === 'number') {
    id = 'localhost:' + id;
  }
  return id.toLowerCase().replace(hostname, 'localhost').replace('mongodb://', '');
};
