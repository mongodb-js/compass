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

var createContactsNumber = function(opts) {
  var dest = new MongoWritableStream({
    url: opts.url,
    collection: 'contacts'
  });
  var src = fs.createReadStream(__dirname + '/contacts-number.json');
  return src.pipe(datasets.createGeneratorStream({
    size: 1000
  })).pipe(dest);
};
var createContactsString = function(opts) {
  var dest = new MongoWritableStream({
    url: opts.url,
    collection: 'contacts'
  });
  var src = fs.createReadStream(__dirname + '/contacts-string.json');
  return src.pipe(datasets.createGeneratorStream({
    size: 1000
  })).pipe(dest);
};
var createContactsBoolean = function(opts) {
  var dest = new MongoWritableStream({
    url: opts.url,
    collection: 'contacts'
  });
  var src = fs.createReadStream(__dirname + '/contacts-boolean.json');
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
    contacts_string: function(cb) {
      createContactsString(opts).on('end', cb);
    },
    contacts_number: function(cb) {
      createContactsNumber(opts).on('end', cb);
    },
    contacts_boolean: function(cb) {
      createContactsBoolean(opts).on('end', cb);
    }
  }, done);
};
