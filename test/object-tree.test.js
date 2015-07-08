var assert = require('assert');
var models = require('../src/object-tree/models');

describe('JSValue', function() {
  var JSValue = models.JSValue;

  it('should be polymorphic depending on input', function() {
    var val = new JSValue('foo');
    assert.equal(val.className, 'JSPrimitiveValue');
    val = new JSValue({
      foo: 1
    });
    assert.equal(val.className, 'JSObject');
    val = new JSValue(['foo', 'bar']);
    assert.equal(val.className, 'JSArray');
  });
});

describe('JSValueCollection', function() {
  var JSValueCollection = models.JSValueCollection;

  it('should parse/serialize mixed primitive values', function() {
    var coll = new JSValueCollection([1, 'foo', false, null], {
      parse: true
    });
    assert.deepEqual(coll.serialize(), [1, 'foo', false, null]);
  });
});

describe('JSPrimitiveValue', function() {
  var JSPrimitiveValue = models.JSPrimitiveValue;

  it('should parse/serialize primitive values', function() {
    var val = new JSPrimitiveValue(1, {
      parse: true
    });
    assert.equal(val.serialize(), 1);
    val = new JSPrimitiveValue('foo', {
      parse: true
    });
    assert.equal(val.serialize(), 'foo');
    val = new JSPrimitiveValue(false, {
      parse: true
    });
    assert.equal(val.serialize(), false);
    val = new JSPrimitiveValue(null, {
      parse: true
    });
    assert.equal(val.serialize(), null);
  });
});

describe('JSArray', function() {
  var JSArray = models.JSArray;

  it('should parse/serialize primitive values', function() {
    var arr = new JSArray([1, 'foo', false, null], {
      parse: true
    });
    assert.deepEqual(arr.serialize(), [1, 'foo', false, null]);
  });

  it('should parse/serialize object values', function() {
    var arr = new JSArray([{
      foo: 1
    }, {
      bar: 1,
      baz: 1
    }], {
      parse: true
    });
    assert.deepEqual(arr.serialize(), [{
      foo: 1
    }, {
      bar: 1,
      baz: 1
    }]);
  });

  it('should parse/serialize really complex arrays', function() {
    var complex = [{
      foo: 1,
      bar: [1, 2, {
        baz: 1
      }, true]
    }, {
      bar: 1,
      baz: {
        foo: null
      }
    }];
    var arr = new JSArray(complex, {
      parse: true
    });
    assert.deepEqual(arr.serialize(), complex);
  });
});

describe('JSMember', function() {
  var JSMember = models.JSMember;

  it('should parse/serialize primitive values', function() {
    var mbr = new JSMember({
      foo: 1
    }, {
      parse: true
    });
    assert.equal(mbr.value.className, 'JSPrimitiveValue');
    assert.deepEqual(mbr.serialize(), {
      foo: 1
    });

    mbr = new JSMember({
      foo: false
    }, {
      parse: true
    });
    assert.equal(mbr.value.className, 'JSPrimitiveValue');
    assert.deepEqual(mbr.serialize(), {
      foo: false
    });
  });
});

describe('JSMemberCollection', function() {
  var JSMemberCollection = models.JSMemberCollection;

  it('should parse/serialize primitive values', function() {
    var coll = new JSMemberCollection([{
      foo: 1
    }, {
      bar: false
    }, {
      baz: null
    }], {
      parse: true
    });
    assert.equal(coll.at(0).className, 'JSMember');
    assert.equal(coll.length, 3);
    assert.deepEqual(coll.serialize(), [{
      foo: 1
    }, {
      bar: false
    }, {
      baz: null
    }]);
  });
});

describe('JSObject', function() {
  var JSObject = models.JSObject;

  it('should parse a flat object correctly', function() {
    var obj = new JSObject({
      foo: 1,
      bar: 2
    }, {
      parse: true
    });
    assert.deepEqual(obj.serialize(), {
      foo: 1,
      bar: 2
    });
  });

  it('should parse a nested object correctly', function() {
    var nested = {
      foo: {
        bar: 1
      }
    };
    var obj = new JSObject(nested, {
      parse: true
    });
    assert.deepEqual(obj.serialize(), nested);
    assert.equal(obj.members.at(0).key, 'foo');
    assert.equal(obj.members.at(0).value.className, 'JSObject');
    assert.equal(obj.members.at(0).value.members.at(0).key, 'bar');
    assert.equal(obj.members.at(0).value.members.at(0).value.serialize(), 1);
  });

  it('should parse an object with an array correctly', function() {
    var withArray = {
      foo: [{
        foo: 1
      }, null, 35]
    };
    var obj = new JSObject(withArray, {
      parse: true
    });
    assert.deepEqual(obj.serialize(), withArray);
    assert.equal(obj.members.at(0).key, 'foo');
    assert.equal(obj.members.at(0).value.className, 'JSArray');
    assert.equal(obj.members.at(0).value.values.length, 3);
    assert.equal(obj.members.at(0).value.values.at(0).className, 'JSObject');
    assert.equal(obj.members.at(0).value.values.at(1).className, 'JSPrimitiveValue');
  });

  it('should parse nested arrays correctly', function() {
    var nestedArrays = {
      foo: [1, 2, 3, ['i', 'am', 'nested']]
    };
    var obj = new JSObject(nestedArrays, {
      parse: true
    });
    assert.deepEqual(obj.serialize(), nestedArrays);
    assert.equal(obj.members.at(0).key, 'foo');
    assert.equal(obj.members.at(0).value.className, 'JSArray');
    assert.equal(obj.members.at(0).value.values.length, 4);
    assert.equal(obj.members.at(0).value.values.at(3).className, 'JSArray');
    assert.equal(obj.members.at(0).value.values.at(3).values.at(1).serialize(), 'am');
  });
});
