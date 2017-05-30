const SINGLE = 'Single';
const REPLICA_SET_NO_PRIMARY = 'ReplicaSetNoPrimary';
const REPLICA_SET_WITH_PRIMARY = 'ReplicaSetWithPrimary';
const SHARDED = 'Sharded';
const UNKNOWN = 'Unknown';

/**
 * List of topology types.
 */
const TOPOLOGY_TYPES = [
  SINGLE,
  REPLICA_SET_NO_PRIMARY,
  REPLICA_SET_WITH_PRIMARY,
  SHARDED,
  UNKNOWN
];

/**
 * List of writable topology types.
 */
const WRITABLE_TOPOLOGY_TYPES = [
  SINGLE,
  REPLICA_SET_WITH_PRIMARY,
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
 * Humanize the topology type for nice reading.
 *
 * @param {String} topologyType - The topology type.
 *
 * @returns {String} The nice to read format.
 */
const humanize = (topologyType) => {
  return HUMANIZED_TYPES[topologyType];
};

module.exports.humanize = humanize;
module.exports.isWritable = isWritable;
module.exports.SINGLE = SINGLE;
module.exports.REPLICA_SET_NO_PRIMARY = REPLICA_SET_NO_PRIMARY;
module.exports.REPLICA_SET_WITH_PRIMARY = REPLICA_SET_WITH_PRIMARY;
module.exports.SHARDED = SHARDED;
module.exports.UNKNOWN = UNKNOWN;
module.exports.TOPOLOGY_TYPES = TOPOLOGY_TYPES;
module.exports.WRITABLE_TOPOLOGY_TYPES = WRITABLE_TOPOLOGY_TYPES;
