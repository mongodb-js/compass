var models = require('../models');
var assert = require('assert');

describe('ChildCollection', function() {
  it('should set the model.parent property to parent of the collection', function() {
    var expr = new models.Expression({
      foo: 1
    }, {
      parse: true
    });
    var collection = new models.ChildCollection(null, {
      parent: expr,
      model: models.LeafValue
    });
    var c = collection.add({
      content: 'foo'
    });
    assert.equal(c.parent, expr);
  });

  it('should add listeners on children\'s change:buffer events to the parent', function(done) {
    var expr = new models.Expression({
      foo: 1
    }, {
      parse: true
    });
    var collection = new models.ChildCollection(null, {
      parent: expr,
      model: models.LeafValue
    });
    var c = collection.add('foo');
    expr.on('change:buffer', function() {
      done();
    });
    c.content = 'bar';
  });

  it('should add listeners on collection\'s add events to the parent', function(done) {
    var expr = new models.Expression({
      foo: 1
    }, {
      parse: true
    });
    var collection = new models.ChildCollection([], {
      parent: expr,
      model: models.LeafValue
    });
    expr.on('change:buffer', function() {
      done();
    });
    collection.add('foo');
  });

  it('should add listeners on collection\'s remove events to the parent', function(done) {
    var expr = new models.Expression({
      foo: 1
    }, {
      parse: true
    });
    var collection = new models.ChildCollection(['foo'], {
      parent: expr,
      model: models.LeafValue
    });
    expr.on('change:buffer', function() {
      done();
    });
    collection.remove(collection.at(0));
  });
});
