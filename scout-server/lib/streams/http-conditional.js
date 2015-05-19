var debug = require('debug')('scout-server:streams:http-conditional');
var _ = require('underscore');
var peek = require('peek-stream');
var crypto = require('crypto');

/**
 * @todo: The "has the first _id changed" algorithm is definitely not ideal
 * for most cases but leaving here to circle back on as
 * HTTP conditionals + mongo are really hard bu thave huge performance benefits.
 */
function getETag(doc, req) {
  var _id = 'o:';
  if (!req._cursorOptions) return Date.now();

  _id += (_.chain(req._cursorOptions)
  .map(function(val, key) {
    if (!val) return null;
    return key + '=' + JSON.stringify(val);
  })
  .filter(function(d) {
    return d !== null;
  })
  .value()
  .join('~') || '0');
  if (doc && doc._id) {
    _id += '|f:' + doc._id.toString();
  }
  debug('raw etag is', _id);
  return crypto.createHash('sha1').update(_id).digest('hex');
}

module.exports = function(transform, req, res) {
  return peek(function(data, swap) {
    var etag = getETag(data, req);
    res.set('ETag', etag);
    if (req.headers['if-none-match'] && req.headers['if-none-match'] === etag) {
      res.status(304).send('').end();
      return swap(null, null);
    }

    return swap(null, transform());
  });
};
