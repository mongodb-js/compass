var OperatorObject = require('./opobject');
var LeafValue = require('./leafvalue');
var _ = require('lodash');
var debug = require('debug')('models:range');

var Range = OperatorObject.extend({
  props: {
    isUpperInclusive: {
      type: 'boolean',
      default: false
    },
    lowerOp: 'state',
    upperOp: 'state',
    lower: 'any',
    upper: 'any'
  },
  constructor: function(lower, upper, isUpperInclusive) {
    var parseObj = {};

    if (lower !== undefined) {
      parseObj['$gte'] = lower;
    }
    if (upper !== undefined) {
      parseObj[isUpperInclusive ? '$lte' : '$lt'] = upper;
    }
    return OperatorObject.prototype.constructor.call(this, parseObj, {
      parse: true
    });
  },
  initialize: function(attr, options) {
    // track lower and upper ValueOperators
    this.lowerOp = this.operators.find(function(op) {
      return _.startsWith(op.operator, '$gt');
    });
    this.upperOp = this.operators.find(function(op) {
      return _.startsWith(op.operator, '$lt');
    });

    // event listener to isUpperInclusive
    this.on('change:isUpperInclusive', this.isUpperInclusiveChanged);

    // redefine upper/lower properties
    Object.defineProperty(this, 'lower', {
      get: function() {
        return this.lowerOp ? this.lowerOp.value.buffer : undefined;
      },
      set: function(val) {
        if (this.lowerOp) {
          if (val === undefined) {
            this.operators.remove(this.lowerOp);
            this.lowerOp = undefined;
            this.trigger('change:lower');
          } else {
            this.lowerOp.value.set('content', val);
            if (this.lowerOp.value.previousAttributes().content !== val) {
              this.trigger('change:lower');
            }
          }
        } else {
          if (val !== undefined) {
            var parseObj = {};
            parseObj['$gte'] = val;
            this.lowerOp = this.operators.add(new ValueOperator(parseObj, {
              parse: true
            }));
          }
        }
      }
    });

    Object.defineProperty(this, 'upper', {
      get: function() {
        return this.upperOp ? this.upperOp.value.buffer : undefined;
      },
      set: function(val) {
        if (this.upperOp) {
          if (val === undefined) {
            this.operators.remove(this.upperOp);
            this.upperOp = undefined;
            this.trigger('change:upper');
          } else {
            this.upperOp.value.set('content', val);
            if (this.upperOp.value.previousAttributes().content !== val) {
              this.trigger('change:upper');
            }
          }
        } else {
          if (val !== undefined) {
            var parseObj = {};
            parseObj[this.isUpperInclusive ? '$lte' : '$lt'] = val;
            this.upperOp = this.operators.add(new ValueOperator(parseObj, {
              parse: true
            }));
          }
        }
      }
    });
  },
  isUpperInclusiveChanged: function(evt) {
    this.upperOp.operator = this.isUpperInclusive ? '$lte' : '$lt';
    this.trigger('change:upper');
  }
});

module.exports.Range = Range;
