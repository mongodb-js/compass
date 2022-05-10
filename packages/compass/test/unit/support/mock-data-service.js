const sinon = require('sinon');
const app = require('hadron-app');
const _ = require('lodash');
const { DataServiceImpl } = require('mongodb-data-service');

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
 * Usage:
 *
 * const app = require('hadron-app');
 * const mockDataService = require('./support/mock-data-service');
 *
 * context('simulate a count return a value of 5', () => {
 *   before(mockDataService.before(null, {count: 5}));
 *   after(mockDataService.after());
 *
 *   it('should return a count of 5', (done) => {
 *     app.dataService.count(ns, filter, opts, (err, res) => {
 *       expect(res).to.be.equal(5);
 *       done();
 *     });
 *   });
 * });
 *
 * context('simulate count returns an error', () => {
 *   before(mockDataService.before({count: new Error('bad count')}));
 *   after(mockDataService.after());
 *
 *   it('should error on a count', (done) => {
 *     app.dataService.count(ns, filter, opts, (err, res) {
 *       expect(err).to.be.an('error');
 *       expect(err.message).to.match(/bad count/);
 *       done();
 *     });
 *   });
 * });
 *
 * @param  {Object} errors  object of errors for each method, e.g. `{count: new Error('bad count')}`
 * @param  {Object} results object of results for each method, e.g. `{count: 5}`
 * @return {[type]}         a mocked data-service object
 */
const mockDataService = function(errors, results) {
  errors = errors || {};
  results = results || {};
  const dataService = new DataServiceImpl({});
  // extract all method names from real data-service
  const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(dataService));
  // create new object with all methods, but mock spy functions that return
  // what we want them to return.
  const mockedDS = _.zipObject(methodNames, _.map(methodNames, (name) => {
    const val = dataService[name];
    // non-function values remain what they are
    if (!_.isFunction(val)) {
      return val;
    }
    // functions are wrapped in spies
    return sinon.spy(function() {
      const lastArg = arguments[arguments.length - 1];
      // check if last function is a callback
      const callback = _.isFunction(lastArg) ? lastArg : null;
      // if not an async method with a callback, just return the result
      if (!callback) {
        return results[name];
      }
      // else, call the callback with either error or result
      return callbackWrapper(callback, errors[name], results[name]);
    });
  }));
  mockedDS.isMocked = true;
  return mockedDS;
};

/**
 * `before` hook for tests that need to mock data-service
 * @param  {Objec} errors     object of errors for each of the calls
 * @param  {Object} results   object of results for each of the calls
 * @return {Function}         returns the function to set up mock data-service
 */
const before = function(errors, results) {
  return function() {
    app.appRegistry.emit('data-service-connected', null, mockDataService(errors, results));
  };
};

module.exports = mockDataService;
module.exports.before = before;
