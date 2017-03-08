const sinon = require('sinon');
const app = require('hadron-app');
const _ = require('lodash');

/**
 * wraps the mocked callbacks and returns either cb(err) or cb(null, res)
 * as is expected from callbacks. This avoids returns where both the error
 * and the result is not null.
 *
 * @param  {Function} cb   the callback function
 * @param  {Any}      err  the potential error
 * @param  {Any}      res  the potential result
 * @return {Any}      returns whatever the callback returns
 */
function callbackWrapper(cb, err, res) {
  if (err) {
    return cb(err);
  }
  return cb(null, res);
}

/**
 * mocks data-service. Takes objects of errors and results, keyed with the
 * method names, and returns those errors/results in the callbacks. For
 * non-callback functions, simply returns the result for that method.
 *
 * Additionally, all mocked data-service methods are also wrapped in a
 * sinon.spy().
 *
 * @param  {Object} errors  object of errors for each method, e.g. `{count: new Error('bad count')}`
 * @param  {Object} ret     object of results for each method, e.g. `{count: 5}`
 * @return {[type]}         a mocked data-service object
 */
const mockDataService = function(errors, results) {
  errors = errors || {};
  results = results || {};
  const mds = _.mapValues({
    collection: (ns, options, cb) => { return callbackWrapper(cb, errors.collection, results.collection); },
    isWritable: () => { return results.isWritable; },
    isMongos: () => { return results.isMongos; },
    buildInfo: (cb) => { return callbackWrapper(cb, errors.buildInfo, results.buildInfo); },
    hostInfo: (cb) => { return callbackWrapper(cb, errors.hostInfo, results.hostInfo); },
    connectionStatus: (cb) => { return callbackWrapper(cb, errors.connectionStatus, results.connectionStatus); },
    usersInfo: (authDb, opts, cb) => { return callbackWrapper(cb, errors.usersInfo, results.usersInfo); },
    listCollections: (dbName, filter, cb) => { return callbackWrapper(cb, errors.listCollections, results.listCollections); },
    listDatabases: (cb) => { return callbackWrapper(cb, errors.listDatabases, results.listDatabases); },
    connect: (cb) => { return callbackWrapper(cb, errors.connect, results.connect); },
    count: (ns, filter, opts, cb) => { return callbackWrapper(cb, errors.count, results.count); },
    createCollection: (ns, opts, cb) => { return callbackWrapper(cb, errors.createCollection, results.createCollection); },
    createIndex: (ns, spec, opts, cb) => { return callbackWrapper(cb, errors.createIndex, results.createIndex); },
    database: (ns, opts, cb) => { return callbackWrapper(cb, errors.database, results.database); },
    find: (ns, filter, opts, cb) => { return callbackWrapper(cb, errors.find, results.find); },
    sample: () => { return { on: sinon.spy() }; }
  }, (val) => {
    return sinon.spy(val);
  });
  mds.isMocked = true;
  return mds;
};

const originalDataServices = [];

/**
 * `before` hook for tests that need to mock data-service
 * @param  {Objec} errors     object of errors for each of the calls
 * @param  {Object} results   object of results for each of the calls
 * @return {Function}         returns the function to set up mock data-service
 */
const before = function(errors, results) {
  return function() {
    originalDataServices.push(app.dataService);
    app.dataService = mockDataService(errors, results);
  };
};

/**
 * `after` hook, restoring the previous data-service
 * @return {[type]} [description]
 */
const after = function() {
  return function() {
    app.dataService = originalDataServices.pop();
  };
};

module.exports = mockDataService;
module.exports.before = before;
module.exports.after = after;
