var datasets = require('mongodb-datasets');
var fs = require('fs');
var MongoWritableStream = require('mongo-writable-stream');
var async = require('async');

var createUsers = function(opts) {
  var dest = new MongoWritableStream({
    url: opts.url,
    collection: 'users'
  });
  var src = fs.createReadStream(__dirname + '/users.json');
  return src.pipe(datasets.createGeneratorStream({
    size: 1000
  })).pipe(dest);
};

var createPaymentMethods = function(opts) {
  var dest = new MongoWritableStream({
    url: opts.url,
    collection: 'payment_methods'
  });
  var src = fs.createReadStream(__dirname + '/payment-methods.json');
  return src.pipe(datasets.createGeneratorStream({
    size: 1000
  })).pipe(dest);
};

module.exports = function(opts, done) {
  opts = opts || {};
  opts.url = opts.url || 'mongodb://localhost:27017/datasets';
  async.parallel({
    users: function(cb) {
      createUsers(opts).on('end', cb);
    },
    payment_methods: function(cb) {
      createPaymentMethods(opts).on('end', cb);
    }
  }, done);
};
