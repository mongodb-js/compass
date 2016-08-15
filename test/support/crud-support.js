'use strict';

const assert = require('assert');
const debug = require('debug')('mongodb-test-utils:crud-support');
const MongoClient = require('mongodb').MongoClient;

/**
 * Shorthand no options insert documents into a test database conneciton.
 *
 * @param {Connection} connection - The connection object.
 * @param {String} coll - The collection name.
 * @param {Array} documents - The documents to insert.
 * @param {Function} done - The callback.
 */
function insertMany(connection, coll, documents, done) {
  MongoClient.connect(connection.driver_url, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection(coll);
    collection.insertMany(documents, function(error, result) {
      assert.equal(null, error);
      debug(result);
      db.close();
      done();
    });
  });
};

/**
 * Remove all the test documents.

 * @param {Connection} connection - The connection object.
 * @param {String} coll - The collection name.
 * @param {Function} done - The callback.
 */
function removeAll(connection, coll, done) {
  MongoClient.connect(connection.driver_url, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection(coll);
    collection.deleteMany({}, {}, function(error, result) {
      assert.equal(null, error);
      debug(result);
      db.close();
      done();
    });
  });
};

module.exports.insertMany = insertMany;
module.exports.removeAll = removeAll;
