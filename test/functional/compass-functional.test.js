describe('Compass Functional Test Suite #spectron', function() {
  before(function() {
    /* Force the node env to testing */
    process.env.NODE_ENV = 'testing';
  });

  describe('#launch', function() {
    require('./tests/launch.test');
  });

  describe('#connect', function() {
    require('./tests/connect.test');
  });

  describe('#rtss', function() {
    require('./tests/rtss.test');
  });

  describe('#databases', function() {
    require('./tests/databases.test');
  });

  describe('#sidebar', function() {
    require('./tests/sidebar.test');
  });

  describe('#collections', function() {
    require('./tests/collections.test');
  });

  describe('#crud', function() {
    require('./tests/crud.test');
  });

  describe.skip('#schema', function() {
    require('./tests/schema.test');
  });

  describe.skip('#explain', function() {
    require('./tests/explain.test');
  });

  describe.skip('#indexes', function() {
    require('./tests/indexes.test');
  });

  describe.skip('#validation', function() {
    require('./tests/validation.test');
  });

  describe.skip('#data-service', function() {
    require('./tests/data-service.test');
  });

  describe.skip('#query-bar', function() {
    require('./tests/query-bar.test.js');
  });
});
