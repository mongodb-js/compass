var AmpersandState = require('ampersand-state');
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-collection');

var DatabaseCollection = require('./database-collection');
var CollectionCollection = require('./collection-collection');

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
    max_bson_object_size: 'number'
  }
});

module.exports = AmpersandModel.extend({
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
  children: {
    databases: DatabaseCollection,
    collections: CollectionCollection,
    host: HostInfo,
    build: BuildInfo
  }
});

module.exports.BuildInfo = BuildInfo;
module.exports.HostInfo = HostInfo;
