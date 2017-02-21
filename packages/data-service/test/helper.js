var chai = require('chai');
var assert = require('assert');
var expect = chai.expect;
var es = require('event-stream');
var Connection = require('mongodb-connection-model');

module.exports.chai = chai;
module.exports.assert = assert;
module.exports.expect = expect;
module.exports.eventStream = es;

module.exports.connection = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'data-service'
});

module.exports.insertTestDocuments = function(client, callback) {
  var collection = client.database.collection('test');
  collection.insertMany([{
    a: 1
  }, {
    a: 2
  }], callback);
};

module.exports.deleteTestDocuments = function(client, callback) {
  var collection = client.database.collection('test');
  collection.deleteMany(callback);
};

module.exports.listDatabases = function(client, callback) {
  var adminDb = client.database.admin();
  adminDb.listDatabases(callback);
};
