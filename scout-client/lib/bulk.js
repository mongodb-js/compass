var Writable = require('stream').Writable,
  util = require('util'),
  debug = require('debug')('mongoscope-client:bulk');

function BulkWriteStream(collection, opts){
  if(!(this instanceof BulkWriteStream)) return new BulkWriteStream(collection, opts);

  opts = opts || {};

  this.batchSize = opts.batchSize || 20;
  this.inflight = 0;

  this.ready = false;
  this.collection = collection;
  this.client = collection.client;
  this.buffer = [];

  this.on('finish', this.onFinish.bind(this));

  // If the collection doesnt already exist, create it.
  collection.read(function(err, res, raw){
    if(raw.status !== 404) return this.onWritable();
    collection.create(this.onWritable.bind(this));
  }.bind(this));

  BulkWriteStream.super_.call(this, {objectMode: true});
}
util.inherits(BulkWriteStream, Writable);

BulkWriteStream.prototype.onWritable = function(err){
  if(err) return this.emit('error', err);

  this.ready = true;
  this.emit('writeable');
};

BulkWriteStream.prototype.flush = function(next){
  debug('flushing buffer');
  var data = this.buffer.slice(0);
  this.inflight += data.length;
  this.buffer = [];

  this.collection.bulk(data, function(err, res){
    debug('sent %d inserted %s', data.length, res.inserted_count);
    this.inflight -= data.length;
    this.emit('flush', res);
    process.nextTick(next.bind(null, err, res));
  }.bind(this));
  return false;
};

// @todo: make all chunks logical instead of building up eg
// batchSize:10 -> you could have 20 because 10 more were added waiting
// for client readable and collection setup.
BulkWriteStream.prototype._write = function(doc, enc, next){
  if(!this.ready) return this.on('writeable', this._write.bind(this, doc, enc, next));

  if(!Array.isArray(doc)) doc = [doc];
  this.buffer.push.apply(this.buffer, doc);

  return (this.buffer.length >= this.batchSize) ? this.flush(next) : next();
};

BulkWriteStream.prototype.onFinish = function(err){
  if(err) return this.emit('error', err);

  debug('caught finish event buffer %d inflight %d', this.buffer.length, this.inflight);
  if(this.buffer.length === 0 && this.inflight === 0){
    debug('buffer drained and none still in flight.  really done.');
    return this.emit('end');
  }
  if(this.buffer.length > 0){
    debug('still have %d items in the buffer to flush', this.buffer.length);
    return this.flush(this.onFinish.bind(this));
  }

  debug('waiting for %d items currently inflight', this.inflight);
  this.once('flush', this.onFinish.bind(this, null));
};

module.exports.createWriteStream = BulkWriteStream;
