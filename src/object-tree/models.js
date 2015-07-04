var AmpersandState = require('ampersand-state');
var AmpersandCollection = require('ampersand-collection');
var LodashMixin = require('ampersand-collection-lodash-mixin');
var _ = require('lodash');


var JSValueCollection = AmpersandCollection.extend(LodashMixin);

var JSPrimitiveValue = AmpersandState.extend({
  className: 'JSPrimitiveValue',
  props: {
    value: {
      type: 'any',
      default: null
    }
  },
  parse: function(attrs) {
    return {
      value: attrs
    };
  },
  serialize: function() {
    return this.value;
  }
});

var JSArray = AmpersandState.extend({
  className: 'JSArray',
  collections: {
    values: JSValueCollection
  },
  parse: function(attrs) {
    return {
      values: attrs
    };
  },
  serialize: function() {
    return this.values.serialize();
  }
});

var JSValue = function(attrs, options) {
  /*eslint no-use-before-define:0*/
  if (_.isPlainObject(attrs)) return new JSObject(attrs, options);
  if (_.isArray(attrs)) return new JSArray(attrs, options);
  return new JSPrimitiveValue(attrs, options);
};

var JSMember = AmpersandState.extend({
  className: 'JSMember',
  props: {
    key: 'string',
    value: 'state'
  },
  parse: function(attrs) {
    var pair = _.pairs(attrs)[0];
    return {
      key: pair[0],
      value: new JSValue(pair[1], {
        parse: true
      })
    };
  },
  serialize: function() {
    var obj = {};
    obj[this.key] = this.value.serialize();
    return obj;
  }
});

var JSMemberCollection = AmpersandCollection.extend(LodashMixin, {
  mainIndex: 'key',
  model: JSMember
});

var JSObject = AmpersandState.extend({
  className: 'JSObject',
  collections: {
    members: JSMemberCollection
  },
  parse: function(attrs) {
    var members = _.map(attrs, function(v, k) {
      return _.object([[k, v]]);
    });
    return {
      members: members
    };
  },
  serialize: function() {
    return _.merge.apply(null, this.members.serialize());
  }
});


JSValueCollection.prototype.model = JSValue;
JSValueCollection.prototype.isModel = function(model) {
  return model instanceof JSPrimitiveValue
    || model instanceof JSArray
    || model instanceof JSObject;
};

JSValueCollection.prototype.parse = function(attrs, options) {
  // need to turn into JSValue models here, because AmpersandCollection does
  // not support false-ish values, instead replaces it with {}
  return _.map(attrs, function(attr) {
    return new JSValue(attr, options);
  });
};

module.exports = {
  JSObject: JSObject,
  JSValue: JSValue,
  JSArray: JSArray,
  JSMember: JSMember,
  JSMemberCollection: JSMemberCollection,
  JSValueCollection: JSValueCollection,
  JSPrimitiveValue: JSPrimitiveValue
};
