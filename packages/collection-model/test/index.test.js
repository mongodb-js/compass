var assert = require('assert');
var Collection = require('../');
var CollectionCollection = require('../').Collection;

describe('@cloud-mongodb-js/mongodb-collection-model', function() {
  it('should work', function() {
    assert(Collection);
  });
  it('should work for .Collection', function() {
    assert(CollectionCollection);
  });
});
