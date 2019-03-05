/**
 * Convert into format expected
 * @param {Object} db - {_id: dbname, collections: ['coll1', 'coll2']}
 * @return {Object}
 */
const makeModel = (db) => {
  const colls = db.collections.map((c) => ({
    _id: `${db._id}.${c}`, database: db._id, capped: false, power_of_two: false, readonly: false
  }));

  return {
    _id: db._id,
    collections: { models: colls },
    toJSON: () => ({
      _id: db._id,
      collections: colls
    })
  };
};

module.exports = {
  makeModel
};
