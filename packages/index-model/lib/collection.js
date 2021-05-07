var Collection = require('ampersand-rest-collection');
var IndexModel = require('./model');
var fetch = require('./fetch');

module.exports = Collection.extend({
  model: IndexModel,
  mainIndex: 'id',
  indexes: ['name'],
  /**
   * queries a MongoDB instance for index details and populates
   * IndexCollection with the indexes in `namespace`.
   *
   * @param  {MongoClient} db     MongoDB driver db handle
   * @param  {String} namespace   namespace to get indexes from, e.g. `test.foo`
   * @return {IndexCollection}    collection of indexes on `namespace`
   */
  fetchIndexes: function(db, namespace) {
    var collection = this;
    collection.trigger('request', collection);
    fetch(db, namespace, function(err, res) {
      if (err) {
        throw err;
      }
      collection.reset(res, {parse: true});
      collection.trigger('sync', collection);
    });
    return collection;
  }
});
