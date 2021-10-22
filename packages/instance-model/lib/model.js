var _ = require('lodash');
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var AmpersandState = require('ampersand-state');
var DatabaseCollection = require('mongodb-database-model').Collection;
var CollectionCollection = require('mongodb-collection-model').Collection;
var hostname = require('os').hostname();

var HostInfo = AmpersandState.extend({
  props: {
    arch: 'string',
    cpu_cores: 'number',
    cpu_frequency: 'number',
    memory_bits: 'number',
    os: 'string',
    os_family: 'string',
    kernel_version: 'string',
    kernel_version_string: 'string'
  }
});

var BuildInfo = AmpersandState.extend({
  props: {
    isEnterprise: 'boolean',
    version: 'string'
  }
});

var genuineMongoDB = AmpersandState.extend({
  props: {
    isGenuine: 'boolean',
    dbType: 'string'
  }
});

var dataLake = AmpersandState.extend({
  props: {
    isDataLake: 'boolean',
    version: 'string'
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
    },
    /**
     * @todo (imlucas) Stabilize and cleanup
     * `replicaset`, `state`, and `aliases`.
     *
     * See: http://npm.im/mongodb-replicaset
     */
    replicaset: 'string',
    state: 'string',
    aliases: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  },
  derived: {
    hostname: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) {
          return undefined;
        }
        return this._id.split(':')[0];
      }
    },
    port: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) {
          return undefined;
        }
        return parseInt(this._id.split(':')[1], 10);
      }
    }
  },
  collections: {
    databases: DatabaseCollection,
    collections: CollectionCollection
  },
  children: {
    host: HostInfo,
    build: BuildInfo,
    genuineMongoDB: genuineMongoDB,
    dataLake: dataLake
  },
  /**
   * Override `AmpersandModel.serialize()` to
   * make logging less chatty and problems easier
   * to debug.
   *
   * @return {Object}
   */
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);

    var model = this;
    if (this.databases.length > 0) {
      _.each(model._children, function(value, key) {
        res[key] = model[key].serialize();
      });
      _.each(model._collections, function(value, key) {
        res[key] = model[key].serialize();
      });
    }
    return res;
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
  return id.toLowerCase()
    .replace(hostname.toLowerCase(), 'localhost')
    .replace('127.0.0.1', 'localhost')
    .replace('mongodb://', '')
    .replace(/^[^@]+@/, '')
    .replace(/\/?\?(?:\w+=[^&]+&)*\w+=[^&]+$/, '');
};
