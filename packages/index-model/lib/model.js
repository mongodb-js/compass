var Model = require('ampersand-model');
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
  usageHost: 'string',
  version: 'number',
  extra: 'object'
};

var IndexModel = Model.extend({
  namespace: 'Index',
  idAttribute: 'id',
  extraProperties: 'reject',
  props: indexModelProps,
  session: {
    relativeSize: 'number'
  },
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
      deps: ['extra', 'key'],
      fn: function() {
        return !!this.extra['2dsphereIndexVersion'] ||
          _.values(this.key).indexOf('2d') > -1 ||
          _.values(this.key).indexOf('geoHaystack') > -1;
      }
    },
    compound: {
      deps: ['key'],
      fn: function() {
        return _.keys(this.key).length > 1;
      }
    },
    single: {
      deps: ['compound'],
      fn: function() {
        return !this.compound;
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
    },
    wildcard: {
      deps: ['extra', 'key'],
      fn: function() {
        return _.keys(this.key).some(function(k) {
          return k === '$**' || k.indexOf('.$**') > -1;
        });
      }
    },
    collation: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra.collation;
      }
    },
    clustered: {
      deps: ['extra'],
      fn: function() {
        return !!this.extra.clustered;
      }
    },
    columnstore: {
      deps: ['extra', 'key'],
      fn: function() {
        return _.values(this.key).some(function(k) {
          return k === 'columnstore';
        });
      }
    },
    type: {
      deps: ['geo', 'hashed', 'text', 'wildcard', 'clustered', 'columnstore'],
      fn: function() {
        if (this.geo) {
          return 'geospatial';
        }
        if (this.hashed) {
          return 'hashed';
        }
        if (this.text) {
          return 'text';
        }
        // Columnstore is before wildcard as it is a special case of wildcard.
        if (this.columnstore) {
          return 'columnstore';
        }
        if (this.wildcard) {
          return 'wildcard';
        }
        if (this.clustered) {
          return 'clustered';
        }
        return 'regular';
      }
    },
    cardinality: {
      deps: ['single'],
      fn: function() {
        return this.single ? 'single' : 'compound';
      }
    },
    properties: {
      deps: ['unique', 'sparse', 'partial', 'ttl', 'collation'],
      fn: function() {
        var model = this;
        var props = ['unique', 'sparse', 'partial', 'ttl', 'collation'];
        return _.filter(props, function(prop) {
          return !!model[prop];
        }).sort(function(a, b) {
          var order = {
            'unique': 1,
            'sparse': 2,
            'partial': 3,
            'ttl': 4,
            'collation': 5
          };
          return order[a] - order[b];
        });
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

module.exports = IndexModel;
