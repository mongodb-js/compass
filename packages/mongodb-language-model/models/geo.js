var Operator = require('./operator');
var _ = require('lodash');
var definitions = require('./definitions');
// var debug = require('debug')('models:geo-operator');


var Geometry = module.exports.Geometry = Operator.extend({
  props: {
    type: {
      type: 'string',
      required: true,
      values: ['Polygon', 'MultiPolygon']
    },
    coordinates: {
      type: 'array',
      required: true
    }
  },
  derived: {
    buffer: {
      deps: ['type', 'coordinates'],
      fn: function() {
        var obj = {};
        obj[this.type] = this.coordinates;
        return obj;
      }
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'Geometry'
    }
  },
  parse: function(attrs) {
    return _.values(attrs)[0];
  },
  serialize: function() {
    return this.buffer;
  }
});

var LegacyShape = module.exports.LegacyShape = Operator.extend({
  props: {
    type: {
      type: 'string',
      required: true,
      values: ['$center', '$centerSphere', '$box', '$polygon']
    },
    parameters: {
      type: 'any',
      required: true
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'LegacyShape'
    }
  },
  derived: {
    buffer: {
      deps: ['type', 'parameters'],
      cache: false,
      fn: function() {
        var obj = {};
        obj[this.type] = this.parameters;
        return obj;
      }
    },
    valid: {
      deps: ['parameters'],
      cache: false,
      fn: function() {
        if (this.type === '$center' || this.type === '$centerSphere') {
          return Array.isArray(this.parameters)
            && this.parameters.length === 2
            && _.isNumber(this.parameters[1])
            && Array.isArray(this.parameters[0])
            && this.parameters[0].length === 2;
        }
        // @todo, validation for $box and $polygon. for now, just need some parameters
        return !!this.parameters;
      }
    }
  },
  parse: function(attrs) {
    if (attrs) {
      var type = _.keys(attrs)[0];
      return {
        type: type,
        parameters: attrs[type]
      };
    }
    return {};
  },
  serialize: function() {
    return this.buffer;
  }
});


/**
 * GeoOperator holds a geo operator key, and one or multiple special operators depending on
 * the type of geo query.
 * e.g. {$geoWithin: {$centerSphere: [ [ -88, 30 ], 10/3963.2 ] } }
 *
 * @type {Operator}
 */
module.exports.GeoOperator = Operator.extend({
  props: {
    operator: {
      type: 'string',
      required: true,
      values: definitions.geoOperators
    },
    shape: {
      type: 'state',
      required: true
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'GeoOperator'
    }
  },
  derived: {
    buffer: {
      deps: ['operator', 'shape'],
      cache: false,
      fn: function() {
        var doc = {};
        if (!this.shape) return doc;
        doc[this.operator] = this.shape.buffer;
        return doc;
      }
    },
    valid: {
      deps: ['shape'],
      cache: false,
      fn: function() {
        // operator is always valid
        return this.shape && this.shape.valid;
      }
    }
  },
  initialize: function() {
    // bubble up buffer change events
    this.listenTo(this.shape, 'change:buffer', this.bufferChanged);
  },
  parse: function(attrs) {
    if (attrs) {
      var key = _.keys(attrs)[0];
      var shape = attrs[key];
      var geoShape;
      if (_.keys(shape)[0] === '$geometry') {
        geoShape = new Geometry(shape, {parse: true});
      } else {
        geoShape = new LegacyShape(shape, {parse: true});
      }
      return {
        operator: key,
        shape: geoShape
      };
    }
    return {};
  },
  serialize: function() {
    return this.buffer;
  }
});
