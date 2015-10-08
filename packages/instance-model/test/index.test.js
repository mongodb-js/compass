var assert = require('assert');
var Instance = require('../');
var hostname = require('os').hostname();

describe('mongodb-instance-model', function() {
  it('should have a derived hostname property', function() {
    assert.equal(new Instance({
      _id: 'localhost:27017'
    }).hostname, 'localhost');
  });
  it('should have a derived port property', function() {
    assert.equal(new Instance({
      _id: 'localhost:27017'
    }).port, 27017);
  });
  describe('getId()', function() {
    it('should substitute localhost as the cannonical hostname', function() {
      assert.equal(Instance.getId(hostname), 'localhost');
    });
    it('should treat a number param as the port', function() {
      assert.equal(Instance.getId(27017), 'localhost:27017');
    });
    it('should remove mongodb://', function() {
      assert.equal(Instance.getId('mongodb://localhost:27017'), 'localhost:27017');
    });
  });
});
