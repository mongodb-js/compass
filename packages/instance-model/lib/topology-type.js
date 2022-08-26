const SINGLE = 'Single';
const REPLICA_SET_NO_PRIMARY = 'ReplicaSetNoPrimary';
const REPLICA_SET_WITH_PRIMARY = 'ReplicaSetWithPrimary';
const SHARDED = 'Sharded';
const LOAD_BALANCED = 'LoadBalanced';
const UNKNOWN = 'Unknown';

/**
 * List of topology types.
 */
const TOPOLOGY_TYPES = [
  SINGLE,
  REPLICA_SET_NO_PRIMARY,
  REPLICA_SET_WITH_PRIMARY,
  SHARDED,
  LOAD_BALANCED,
  UNKNOWN
];

/**
 * Readable read preferences with a topology of
 * replica set no primary.
 */
const REPLICA_SET_NO_PRIMARY_READABLE = [
  'primaryPreferred',
  'secondary',
  'secondaryPreferred',
  'nearest'
];

/**
 * Readable read preferences with a topology of
 * replica set with primary.
 */
const REPLICA_SET_WITH_PRIMARY_READABLE =
  REPLICA_SET_NO_PRIMARY_READABLE.concat([ 'primary' ]);

/**
 * List of writable topology types.
 */
const WRITABLE_TOPOLOGY_TYPES = [
  SINGLE,
  REPLICA_SET_WITH_PRIMARY,
  LOAD_BALANCED,
  SHARDED
];

/**
 * Humanized types.
 */
const HUMANIZED_TYPES = {
  'Single': 'Single',
  'ReplicaSetNoPrimary': 'Replica Set (No Primary)',
  'ReplicaSetWithPrimary': 'Replica Set (With Primary)',
  'Sharded': 'Sharded Cluster',
  'LoadBalanced': 'Using Load Balancer',
  'Unknown': 'Unknown'
};

/**
 * determine if the topology type is writable.
 *
 * @param {String} topologyType - the topology type.
 *
 * @returns {Boolean} if the topology type is writable.
 */
const isWritable = (topologyType) => {
  return WRITABLE_TOPOLOGY_TYPES.includes(topologyType);
};

/**
 * Determines if the topology is readable based on the type and
 * read preference.
 *
 * @param {String} topologyType - the topology type.
 * @param {String} readPreference - the read preference.
 *
 * @returns {Boolean} if the topology type is readable.
 */
const isReadable = (topologyType, readPreference) => {
  switch (topologyType) {
    case UNKNOWN:
      return false;
    case REPLICA_SET_NO_PRIMARY:
      return REPLICA_SET_NO_PRIMARY_READABLE.includes(readPreference);
    case REPLICA_SET_WITH_PRIMARY:
      return REPLICA_SET_WITH_PRIMARY_READABLE.includes(readPreference);
    default:
      return true;
  }
};

/**
 * Humanize the topology type for nice reading.
 *
 * @param {String} topologyType - The topology type.
 *
 * @returns {String} The nice to read format.
 */
const humanize = (topologyType) => {
  return HUMANIZED_TYPES[topologyType];
};

module.exports = {
  humanize,
  isWritable,
  isReadable,
  SINGLE,
  REPLICA_SET_NO_PRIMARY,
  REPLICA_SET_WITH_PRIMARY,
  SHARDED,
  LOAD_BALANCED,
  UNKNOWN,
  TOPOLOGY_TYPES,
  WRITABLE_TOPOLOGY_TYPES,
};
