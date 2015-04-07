var _ = require('underscore'),
  AmpersandModel = require('ampersand-model'),
  InstanceCollection = require('./instance-collection'),
  types = require('../types');

var dataTypes = {
  deployment_id: {
    set: function(newVal) {
      return {
        type: 'deployment_id',
        val: types.deployment_id(newVal)
      };
    },
  }
};

var Deployment = AmpersandModel.extend({
  dataTypes: dataTypes,
  props: {
    _id: {
      type: 'deployment_id',
      required: true
    },
    name: {
      type: 'string',
      required: true
    },
    sharding: {
      type: 'any',
      required: false,
      allowNull: true,
      default: null
    },
  },
  children: {
    instances: InstanceCollection
  },
  derived: {
    /**
     * Simple hueristics to see if we might be connected directly to a shard
     * which shows up like a replicaset and has no way of knowing that it
     * is merely a shard and not a replicaset.
     */
    maybe_sharded: {
      deps: ['sharding', 'rs'],
      fn: function() {
        if (this.sharding) return true;
        return (/\d$/.test((this.rs || '')));
      }
    },
    instance_ids: {
      deps: ['instances'],
      fn: function() {
        return _.pluck(this.instances.models, '_id');
      }
    },
    type: {
      deps: ['sharding', 'rs'],
      fn: function() {
        if (this.sharding) return 'cluster';
        if (this.rs) return 'replicaset';
        return 'standalone';
      }
    },
    // The replicaset name if this is a replicaset deployment.
    // @todo: rename to `replicaset`
    rs: {
      deps: ['instances'],
      fn: function() {
        return _.chain(this.instances.models)
          .pluck('rs')
          .compact()
          .first()
          .value();
      }
    },
    connection_count: {
      deps: ['instances'],
      fn: function() {
        return _.chain(this.instances.models)
          .map(function(i) {
            // @todo: add derived connection_count to instance.js
            return i.connections ? _.keys(i.connections).length : 0;
          })
          .reduce(function(a, b) {
            return a + b;
          })
          .value();
      }
    },
    is_standalone: {
      deps: ['type'],
      fn: function() {
        return this.type === 'standalone';
      }
    },
    has_sharding: {
      deps: ['type'],
      fn: function() {
        return this.type === 'cluster';
      }
    },
    has_replication: {
      deps: ['type'],
      fn: function() {
        return this.type !== 'standalone';
      }
    }
  }
});

module.exports = Deployment;
