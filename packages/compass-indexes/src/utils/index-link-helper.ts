/* eslint-disable @mongodb-js/compass/no-mongodb-link-without-utm-params */
// Eslint rule disabled for the file because we add the utm parameters
// dynamically in getIndexHelpLink method
const HELP_URLS = {
  SINGLE: 'https://mongodb.com/docs/manual/core/index-single/',
  COMPOUND: 'https://mongodb.com/docs/manual/core/index-compound/',
  UNIQUE: 'https://mongodb.com/docs/manual/core/index-unique/',
  PARTIAL: 'https://mongodb.com/docs/manual/core/index-partial/',
  SPARSE: 'https://mongodb.com/docs/manual/core/index-sparse/',
  TTL: 'https://mongodb.com/docs/manual/core/index-ttl/',
  '2D': 'https://mongodb.com/docs/manual/core/2d/',
  '2DSPHERE': 'https://mongodb.com/docs/manual/core/2dsphere/',
  GEOHAYSTACK: 'https://mongodb.com/docs/manual/core/geohaystack/',
  GEOSPATIAL:
    'https://mongodb.com/docs/manual/applications/geospatial-indexes/#geospatial-indexes',
  WILDCARD: 'https://mongodb.com/docs/manual/core/index-wildcard/',
  CLUSTERED: 'https://www.mongodb.com/docs/manual/core/clustered-collections/',
  // TODO: add an entry for COLUMNSTORE once the docs become available
  //_NEW TODO: add an entry for COLUMNSTORE once the docs become available
  // see https://jira.mongodb.org/browse/COMPASS-5774
  COLUMNSTORE: null,
  TEXT: 'https://mongodb.com/docs/manual/core/index-text/',
  HASHED: 'https://mongodb.com/docs/manual/core/index-hashed/',
  REGULAR: 'https://mongodb.com/docs/manual/indexes/#single-field',
  COLLATION:
    'https://mongodb.com/docs/master/reference/bson-type-comparison-order/#collation',
  COLLATION_REF: 'https://mongodb.com/docs/master/reference/collation',
  UNKNOWN: null,
};

const addUTMAttrs = (url: string) => {
  const parsed = new URL(url);
  if (!parsed.host.includes('mongodb')) {
    return url;
  }
  parsed.searchParams.set('utm_source', 'compass');
  parsed.searchParams.set('utm_medium', 'product');
  return parsed.toString();
};

/**
 * The function looks up index help links.
 *
 * @param {String} section - The name of the section to open.
 */
export default function getIndexHelpLink(section = 'UNKNOWN') {
  const url = (HELP_URLS as Record<string, string | null>)[section];
  return url ? addUTMAttrs(url) : null;
}
