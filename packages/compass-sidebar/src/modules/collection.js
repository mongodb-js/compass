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
 * @param {Boolean} isReadonly - If the collection is a view.
 * @param {String} database - The database name.
 * @param {String} name - The source collection name.
 *
 * @returns {String} The full source namespace.
 */
export const getSourceName = (isReadonly, database, name) => {
  if (isReadonly) {
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

/**
 * Get the collection metadata to pass to the collection plugin.
 *
 * @param {Object} collection - The collection object.
 * @param {Array} collections - The list of all collections in the db.
 * @param {String} database - The database name.
 * @param {String} editViewName - The name of the view being edited.
 *
 * @returns {Object} The collection metadata.
 */
export const collectionMetadata = (collection, collections, database, editViewName) => {
  const source = getSource(collection.view_on, collections);
  return {
    namespace: collection._id,
    isReadonly: collection.readonly,
    sourceName: getSourceName(collection.readonly, database, collection.view_on),
    isSourceReadonly: source ? source.readonly : false,
    sourceViewOn: getSourceViewOn(database, source),
    sourcePipeline: collection.pipeline,
    editViewName: editViewName
  };
};
