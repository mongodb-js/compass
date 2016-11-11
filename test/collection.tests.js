// const expect = require('chai').expect;
const CollectionStore = require('../src/internal-packages/collection/lib/store/');

describe('CollectionStore', function() {
  let unsubscribe;

  beforeEach(function() {
    unsubscribe = function() {};
    CollectionStore.clearStats();
  });

  afterEach(function() {
    unsubscribe();
  });

  it('has an initial state', function() {
    // expect()
  });
});
