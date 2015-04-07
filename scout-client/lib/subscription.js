var util = require('util'),
  stream = require('stream');

module.exports = Subscription;

var _lastId = 0;
var generateId = function() {
  return _lastId++;
};

function Subscription(client, url, opts) {
  if (!(this instanceof Subscription)) return new Subscription(client, url, opts);

  Subscription.super_.call(this, {
    objectMode: true
  });

  opts = opts || {};

  this.client = client;
  this.url = url;
  this.payload = this.client.context.get('token', 'instance_id');
  Object.keys(opts).map(function(key) {
    this.payload[key] = opts.key;
  }.bind(this));

  this.id = generateId();
  this.listening = false;

  this.debug = require('debug')('scout-client:subscription:' + this.id);

  client.on('close', this.close.bind(this));
  this.debug('subscription created for ' + this.url);
}
util.inherits(Subscription, stream.Readable);

Subscription.prototype._read = function() {
  if (this.listening) return this;

  this.listening = true;

  this.debug('sending payload', this.payload);
  this.client.io
  .on(this.url, this.onData.bind(this))
  .on(this.url + '/error', this.onError.bind(this))
  .emit(this.url, this.payload);
  return this;
};

Subscription.prototype.onData = function(data) {
  this.debug('got data', data);
  this.push(data);
};

Subscription.prototype.onError = function(data) {
  var err = new Error();
  err.code = data.code;
  err.http = data.http;
  err.message = data.message;
  Error.captureStackTrace(err, this);
  this.emit('error', err);
};

Subscription.prototype.close = function() {
  // @todo: check io.closed instead?
  if (!this.client.io.connected) {
    this.debug('client already closed');
    return;
  }

  this.client.io
  .off(this.url)
  .on(this.url + '/unsubscribe_complete', function() {
    this.push(null);
  }.bind(this))
  .emit(this.url + '/unsubscribe', this.payload);
};
