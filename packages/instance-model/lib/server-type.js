const STANDALONE = 'Standalone';
const MONGOS = 'Mongos';
const POSSIBLE_PRIMARY = 'PossiblePrimary';
const RS_PRIMARY = 'RSPrimary';
const RS_SECONDARY = 'RSSecondary';
const RS_ARBITER = 'RSArbiter';
const RS_OTHER = 'RSOther';
const RS_GHOST = 'RSGhost';
const UNKNOWN = 'Unknown';

/**
 * List of all server types.
 */
const SERVER_TYPES = [
  STANDALONE,
  MONGOS,
  POSSIBLE_PRIMARY,
  RS_PRIMARY,
  RS_SECONDARY,
  RS_ARBITER,
  RS_OTHER,
  RS_GHOST,
  UNKNOWN
];

/**
 * Server types that accept writes.
 */
const WRITABLE_SERVER_TYPES = [
  STANDALONE,
  MONGOS,
  RS_PRIMARY
];

/**
 * Humanized types.
 */
const HUMANIZED_TYPES = {
  'Standalone': 'Standalone',
  'Mongos': 'Mongos',
  'PossiblePrimary': 'Possible Primary',
  'RSPrimary': 'Primary',
  'RSSecondary': 'Secondary',
  'RSArbiter': 'Arbiter',
  'RSOther': 'Other',
  'RSGhost': 'Ghost',
  'Unknown': 'Unknown'
};

/**
 * Humanize the server type for nice reading.
 *
 * @param {String} serverType - The server type.
 *
 * @returns {String} The nice to read format.
 */
const humanize = (serverType) => {
  return HUMANIZED_TYPES[serverType];
};

/**
 * Determine if the server type is writable.
 *
 * @param {String} serverType - The server type.
 *
 * @returns {Boolean} If the server type is writable.
 */
const isWritable = (serverType) => {
  return WRITABLE_SERVER_TYPES.includes(serverType);
};

module.exports = {
  humanize,
  isWritable,
  STANDALONE,
  MONGOS,
  POSSIBLE_PRIMARY,
  RS_PRIMARY,
  RS_SECONDARY,
  RS_ARBITER,
  RS_OTHER,
  RS_GHOST,
  UNKNOWN,
  SERVER_TYPES,
  WRITABLE_SERVER_TYPES
};
