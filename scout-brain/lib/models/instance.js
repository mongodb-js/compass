var State = require('ampersand-state'),
  _ = require('underscore');

/**
 * @const STATUS The instance's `MemberStatus` in the repliacaset.
 */
var STATUS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ARBITER: 'arbiter',
  STARTUP: [
    'startup',
    'startup2'
  ],
  ERROR: [
    'recovering',
    'fatal',
    'unknown', // remote node not yet reached
    'down', // node not reachable for a report
    'rollback', // node is currently rolling back changes
    'shunned' // node shunned from replicaset
  ],
  UNKNOWN: 'unknown'
};

/**
 * Any MongoDB instance (a.k.a. process).
 */
var Instance = State.extend({
  props: {
    _id: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string',
      required: true
    },
    type: {
      type: 'string',
      required: true,
      values: ['store', 'router', 'config']
    }
  },
  dataTypes: {
    status: {
      default: function() {
        return STATUS.UNKNOWN;
      }
    }
  }
});

/**
 * An instance of the `mongod` process that:
 *
 * - is not a member of a replicaset or shard
 * - was not started with the `--configsrv` option
 */
var Store = module.exports.Store = Instance.extend({
  initialize: function() {
    this.type = 'store';
  }
});

var ReplicasetMember = {
  props: {
    /**
     * The replicaset name this instance is currently a
     * member of, e.g. `replicom`, `exfm`, etc.
     */
    rs: {
      type: 'string',
      required: true
    }
  }
};

/**
 * `mongod` processes that are members of a replicaset also have a notion of
 * which replicaset it is currently in (`rs`) and it's current `state` (as
 * reported by itself or another member of the replicaset).
 */
module.exports.ReplicasetStore = Store.extend(ReplicasetMember, {
  props: {
    status: {
      type: 'status',
      values: _.union(STATUS.STARTUP, STATUS.ERROR, [STATUS.PRIMARY, STATUS.SECONDARY])
    }
  }
});

/**
 * `mongod` process that only acts as a voting member of the replicaset
 * and is not actually a store.
 */
module.exports.Arbiter = Store.extend(ReplicasetMember, {
  props: {
    status: {
      type: 'status',
      values: [STATUS.ARBITER]
    }
  }
});

module.exports.ClusteredStore = Store.extend({
  props: {
    /**
     * Which shard this store is on, e.g.
     * `clusterco-0`, `clusterco-1`.
     */
    shard: {
      type: 'string',
      required: true
    },
    /**
     * The state of this instance within the shard.
     */
    status: {
      type: 'status',
      values: _.union(STATUS.STARTUP, STATUS.ERROR, [STATUS.PRIMARY, STATUS.SECONDARY])
    }
  }
});

/**
 * An instance of the `mongos` process.
 */
module.exports.Router = Instance.extend({
  initialize: function() {
    this.type = 'router';
  }
});

/**
 * An instance of the `mongod` process WITH the `--configsrv` option.
 */
module.exports.Config = Instance.extend({
  initialize: function() {
    this.type = 'config';
  }
});
