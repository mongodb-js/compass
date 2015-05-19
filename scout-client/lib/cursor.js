var util = require('util'),
  stream = require('stream'),
  debug = require('debug')('scout-client:cursor');

function Batch() {
  if (!(this instanceof Batch)) return new Batch();
  this.message = {};
  this.nReturned = 0;
  this.pos = -1;
  this.data = [];
}

function ClientCursor(ns, query, nToReturn, nToSkip, fieldsToReturn, queryOptions) {
  if (!(this instanceof ClientCursor)) {
    return new ClientCursor(ns, query, nToReturn, nToSkip,
    fieldsToReturn, queryOptions);
  }

  ClientCursor.super_.call(this, {
    objectMode: true
  });
  this.ns = ns;
  this.query = query || {};
  this.nToReturn = nToReturn || 10;
  this.nToSkip = nToSkip || 0;
  this.fieldsToReturn = fieldsToReturn || null;
  this.queryOptions = queryOptions || {};

  this.cursorId = 0;
  this.batch = new Batch();
}
util.inherits(ClientCursor, stream.Readable);

ClientCursor.prototype.createBatch = Batch;

ClientCursor.prototype._read = function() {
  this.next(function(err, doc) {
    if (err) return this.emit('error');
    this.push(doc);

  }.bind(this));
};

ClientCursor.prototype.next = function(fn) {
  this.more(function(err, has) {
    if (err) return fn(err);
    if (!has) {
      return fn(null, null);
    }

    this.batch.pos++;
    var o = this.batch.data[this.batch.pos];
    if (!o) {
      // @todo: (lucas) Ugh.... Not sure where this bug is
      // but this shouldnt be allowed to happen.
      return fn(null, null);
    }
    fn(null, o);
  }.bind(this));
};

ClientCursor.prototype.more = function(fn) {
  if (this.batch.pos >= this.nToReturn) {
    return fn(null, false);
  }
  if (this.batch.pos >= 0 && this.batch.pos < (this.batch.nReturned - 1)) {
    return fn(null, true);
  }
  this.requestMore(function(err) {
    if (err) return fn(err);
    fn(null, this.batch.pos < this.batch.nReturned);
  }.bind(this));
};

// Oh hey!  we found some networking!
ClientCursor.prototype.requestMore = function(fn) {
  return fn(new Error('Client should override this'));
};

ClientCursor.prototype.hasNext = function(fn) {
  this.more(fn);
};

ClientCursor.prototype.objsLeftInBatch = function() {
  return this.batch.nReturned - this.batch.pos;
};

ClientCursor.prototype.moreInCurrentBatch = function() {
  return this.objsLeftInBatch() > 0;
};

module.exports = ClientCursor;

module.exports.createReadStream = function(client, ns, opts) {
  opts = opts || {};
  var query = opts.query || {},
    batchSize = opts.batchSize || opts.limit || 100,
    skip = opts.skip || 0,
    fields = opts.fields || null,
    options = opts.options || null,
    cursor = new ClientCursor(ns, query, batchSize, skip, fields, options);

  cursor.requestMore = function(cb) {
    var p = {
      query: cursor.query,
      skip: cursor.nToSkip,
      limit: cursor.nToReturn,
      fields: cursor.fieldsToReturn,
      options: cursor.queryOptions
    };

    client.find(ns, p, function(err, res) {
      if (err) return cb(err);
      cursor.batch = cursor.createBatch();
      cursor.batch.nReturned = res.length;
      cursor.batch.data = res;

      cursor.nToSkip += cursor.nToReturn;
      cb();
    });
  };
  return cursor;
};
