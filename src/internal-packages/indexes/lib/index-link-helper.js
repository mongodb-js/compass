const _ = require('lodash');
const shell = require('electron').shell;

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
  UNKNOWN: null
};

/**
 * The function opens index help links.
 *
 * @param {String} section - The name of the section to open.
 */
function openIndexHelpLink(section) {
  const url = _.get(HELP_URLS, section, 'UNKNOWN');
  if (url) {
    shell.openExternal(url);
  }
}

module.exports = openIndexHelpLink;
