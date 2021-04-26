var chai = require('chai');
var assert = require('assert');
var expect = chai.expect;
var Connection = require('mongodb-connection-model');

var sinonChai = require('sinon-chai');
chai.use(sinonChai);

module.exports.chai = chai;
module.exports.assert = assert;
module.exports.expect = expect;

module.exports.connection = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'data-service'
});

module.exports.insertTestDocuments = function(client, callback) {
  var collection = client.database.collection('test');
  collection.insertMany(
    [
      {
        1: 'a',
        a: 1
      },
      {
        2: 'a',
        a: 2
      }
    ],
    callback
  );
};

module.exports.deleteTestDocuments = function(client, callback) {
  var collection = client.database.collection('test');
  collection.deleteMany(callback);
};
