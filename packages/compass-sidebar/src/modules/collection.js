import toNS from 'mongodb-ns';

/**
 * Get the source object.
 *
 * @param {String} name - The source collection name.
 * @param {Array} collections - The collections to search.
 *
 * @returns {Object} The source object.
 */
export const getSource = (name, collections) => {
  return collections.find((coll) => {
    return toNS(coll._id).collection === name;
  });
};

/**
 * Generate a source namespace.
 *
 * @param {Boolean} isReadonly - If the collection is readonly, i.e. could be a view.
 * @param {String} database - The database name.
 * @param {String} name - The source collection name.
 *
 * @returns {String} The full source namespace.
 */
export const getSourceName = (isReadonly, database, name) => {
  if (isReadonly && name) {
    return `${database}.${name}`;
  }
  return null;
};

/**
 * Get the source view name.
 *
 * @param {String} database - The database.
 * @param {Object} source - The source object.
 *
 * @returns {String} The source view on name.
 */
export const getSourceViewOn = (database, source) => {
  if (source && source.view_on) {
    return `${database}.${source.view_on}`;
  }
  return null;
};

export const TIME_SERIES_COLLECTION_TYPE = 'timeseries';
