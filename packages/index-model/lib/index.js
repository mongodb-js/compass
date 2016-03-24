var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');
var _ = require('lodash');

var IndexFieldCollection = require('./index-field').Collection;

// var debug = require('debug')('mongodb-index-model:index-model');

var indexModelProps = {
  ns: 'string',
  key: 'object',
  name: 'string',
  size: 'number',
  usageCount: 'number',
  usageSince: 'date',
  version: 'number',
  extra: 'object'
};

var IndexModel = Model.extend({
  namespace: 'Index',
  idAttribute: 'id',
  extraProperties: 'reject',
  props: indexModelProps,
  derived: {
    id: {
      deps: ['name', 'ns'],
      fn: function() {
        return this.ns + '.' + this.name;
      }
    },
    unique: {
      deps: ['extra', 'name'],
      fn: function() {
        return this.name === '_id_' || !!this.extra.unique;
      }
    },
    sparse: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra.sparse;
      }
    },
    ttl: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra.expireAfterSeconds;
      }
    },
    hashed: {
      deps: ['key'],
      fn: function() {
        return _.values(this.key).indexOf('hashed') > -1;
      }
    },
    geo: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra['2dsphereIndexVersion'];
      }
    },
    compound: {
      deps: ['key'],
      fn: function() {
        return _.keys(this.key).length > 1;
      }
    },
    partial: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra.partialFilterExpression;
      }
    },
    text: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra.textIndexVersion;
      }
    }
  },
  collections: {
    fields: IndexFieldCollection
  },
  parse: function(attrs) {
    // rename v to version
    attrs.version = attrs.v;
    delete attrs.v;

    // move all other fields to a nested `extra` object
    attrs.extra = _.omit(attrs, _.keys(indexModelProps));
    _.each(_.keys(attrs.extra), function(key) {
      delete attrs[key];
    });

    // fields
    attrs.fields = _.map(attrs.key, function(val, key) {
      return {
        field: key,
        value: val
      };
    });

    return attrs;
  },
  serialize: function() {
    return this.getAttributes({
      props: true, derived: true
    });
  }
});

var IndexCollection = Collection.extend({
  model: IndexModel,
  mainIndex: 'id',
  indexes: ['name']
});

module.exports = IndexModel;
module.exports.Collection = IndexCollection;
