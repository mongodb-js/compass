var helper = require('./helper');

var assert = helper.assert;
var expect = helper.expect;

var DataService = require('../lib/data-service');

describe('DataService', function() {
  var dataService = null;

  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')());

  before(function() {
    dataService = new DataService(helper.connection);
  });

  describe('#get', function() {
    context('when the url is /instance', function() {
      context('when passing options', function() {
        it('returns the instance details', function(done) {
          dataService.connect(function(error, service) {
            assert.equal(null, error);
            service.get('/instance', {}, function(err, instance) {
              assert.equal(null, err);
              expect(instance.host).to.not.equal(null);
              done();
            });
          });
        });
      });

      context('when passing no options', function() {
        it('returns the instance details', function(done) {
          dataService.connect(function(error, service) {
            assert.equal(null, error);
            service.get('/instance', function(err, instance) {
              assert.equal(null, err);
              expect(instance.host).to.not.equal(null);
              done();
            });
          });
        });
      });
    });
    context('when the url is /deployments', function() {
    });
    context('when the url is /deployments/deploymentId', function() {
    });
    context('when the url is /databases/:database', function() {
    });
    context('when the url is /collections/:ns', function() {
    });
    context('when the url is /collections/:ns/count', function() {
    });
    context('when the url is /collections/:ns/find', function() {
    });
    context('when the url is /collections/:ns/aggregate', function() {
    });
  });
});
