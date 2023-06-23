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
  GEOSPATIAL:
    'https://docs.mongodb.org/manual/applications/geospatial-indexes/#geospatial-indexes',
  WILDCARD: 'https://docs.mongodb.com/manual/core/index-wildcard/',
  CLUSTERED: 'https://www.mongodb.com/docs/manual/core/clustered-collections/',
  // TODO: add an entry for COLUMNSTORE once the docs become available
  // see https://jira.mongodb.org/browse/COMPASS-5774
  COLUMNSTORE: null,
  TEXT: 'https://docs.mongodb.org/manual/core/index-text/',
  HASHED: 'https://docs.mongodb.org/manual/core/index-hashed/',
  REGULAR: 'https://docs.mongodb.com/manual/indexes/#single-field',
  COLLATION:
    'https://docs.mongodb.com/master/reference/bson-type-comparison-order/#collation',
  COLLATION_REF: 'https://docs.mongodb.com/master/reference/collation',
  HIDDEN: 'https://www.mongodb.com/docs/manual/core/index-hidden/',
  UNKNOWN: null,
};

type HELP_URL_KEY =
  | Uppercase<keyof typeof HELP_URLS>
  | Lowercase<keyof typeof HELP_URLS>;

/**
 * The function looks up index help links.
 *
 * @param {String} section - The name of the section to open.
 */
export default function getIndexHelpLink(section: HELP_URL_KEY = 'UNKNOWN') {
  return HELP_URLS[section?.toUpperCase() as Uppercase<typeof section>] ?? null;
}
