describe('Compass Functional Test Suite #spectron', function() {
  before(function() {
    /* Force the node env to testing */
    process.env.NODE_ENV = 'testing';
  });

  describe('Application Launch', function() {
    require('./tests/launch.test');
  });

  describe('Connecting to an Instance', function() {
    require('./tests/connect.test');
  });

  describe('Performance tab', function() {
    require('./tests/rtss.test');
  });

  describe('Creating Database', function() {
    require('./tests/create-databases.test');
  });

  describe('Sidebar', function() {
    require('./tests/sidebar.test');
  });

  describe.skip('Deleting Database', function() {
    require('./tests/delete-databases.test');
  });

  describe.skip('Creating & Deleting Collections', function() {
    require('./tests/collections.test');
  });

  describe.skip('Query Bar', function() {
    require('./tests/querybar.test.js');
  });

  describe.skip('CRUD', function() {
    require('./tests/crud.test');
  });

  describe.skip('Schema', function() {
    require('./tests/schema.test');
  });

  describe.skip('Explain', function() {
    require('./tests/explain.test');
  });

  describe.skip('Indexes', function() {
    require('./tests/indexes.test');
  });

  describe.skip('Validation', function() {
    require('./tests/validation.test');
  });

  describe.skip('Data Service', function() {
    require('./tests/data-service.test');
  });
});
