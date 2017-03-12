describe('Compass Functional Test Suite #spectron', function() {
  before(function() {
    /* Force the node env to testing */
    process.env.NODE_ENV = 'testing';
  });

  describe('Application Launch', function() {
    require('./tests/compass-launch.test');
  });

  describe('Connecting to an Instance', function() {
    require('./tests/compass-connect.test');
  });

  describe.skip('Performance tab', function() {
    require('./tests/compass-rtss.test');
  });

  describe.skip('Creating Database', function() {
    require('./tests/compass-databases.test');
  });

  describe.skip('Sidebar', function() {
    require('./tests/compass-sidebase.test');
  });

  describe.skip('Deleting Database', function() {
    require('./tests/compass-delete-databases.test');
  });

  describe.skip('Creating & Deleting Collections', function() {
    require('./tests/compass-collections.test');
  });

  describe('Query Bar', function() {
    require('./tests/querybar-functional.test.js');
  });

  describe.skip('CRUD', function() {
    require('./tests/compass-crud.test');
  });

  describe.skip('Schema', function() {
    require('./tests/compass-schema.test');
  });

  describe.skip('Explain', function() {
    require('./tests/compass-explain.test');
  });

  describe.skip('Indexes', function() {
    require('./tests/compass-indexes.test');
  });

  describe.skip('Validation', function() {
    require('./tests/compass-validation.test');
  });

  describe.skip('Data Service', function() {
    require('./tests/compass-data-service.test');
  });
});
