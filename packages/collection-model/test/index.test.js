var assert = require('assert');
var Collection = require('../');
var CollectionCollection = require('../').Collection;

describe('mongodb-collection-model', function() {
  it('should work', function() {
    assert(Collection);
  });
  it('should work for .Collection', function() {
    assert(CollectionCollection);
  });
});
