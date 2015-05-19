var es = require('event-stream');
var _ = require('underscore');
var debug = require('debug')('scout-server:streams:id-to-document');

/**
 * Take an `_id` and emit the source document.
 *
 * @param {mongodb.Db} db
 * @param {String} collection_name to source from.
 * @option {Object} fields to return for each document [default: `null`].
 * @returns {stream.Transform}
 * @api private
 */
module.exports = function _idToDocument(db, collection_name, opts) {
  opts = _.defaults((opts || {}), {
    fields: null
  });

  var collection = db.collection(collection_name);
  return es.map(function(_id, fn) {
    var query = {
      _id: _id
    };
    var options = {
      fields: opts.fields
    };

    debug('pulling document %j', {
      query: query,
      options: options
    });

    collection.findOne(query, options, function(err, doc) {
      if (err) {
        debug('error pulling document: ', err);
        return fn(err);
      }
      debug('pulled document %j', doc);
      fn(null, doc);
    });
  });
};
