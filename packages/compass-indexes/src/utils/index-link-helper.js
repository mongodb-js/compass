const HELP_URLS = {
  SINGLE: 'https://docs.mongodb.org/manual/core/index-single/',
  COMPOUND: 'https://docs.mongodb.org/manual/core/index-compound/',
  UNIQUE: 'https://docs.mongodb.org/manual/core/index-unique/',
  PARTIAL: 'https://docs.mongodb.org/manual/core/index-partial/',
  SPARSE: 'https://docs.mongodb.org/manual/core/index-sparse/',
  TTL: 'https://docs.mongodb.org/manual/core/index-ttl/',
  '2D': 'https://docs.mongodb.org/manual/core/2d/',
  '2DSPHERE': 'https://docs.mongodb.org/manual/core/2dsphere/',
  GEOHAYSTACK: 'https://docs.mongodb.org/manual/core/geohaystack/',
  GEOSPATIAL: 'https://docs.mongodb.org/manual/applications/geospatial-indexes/#geospatial-indexes',
  TEXT: 'https://docs.mongodb.org/manual/core/index-text/',
  HASHED: 'https://docs.mongodb.org/manual/core/index-hashed/',
  REGULAR: 'https://docs.mongodb.com/manual/indexes/#single-field',
  COLLATION: 'https://docs.mongodb.com/master/reference/bson-type-comparison-order/#collation',
  UNKNOWN: null
};

/**
 * The function looks up index help links.
 *
 * @param {String} section - The name of the section to open.
 * @returns {String} - the link.
 */
function getIndexHelpLink(section) {
  return HELP_URLS[section] || null;
}

module.exports = getIndexHelpLink;
