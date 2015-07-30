var ChildCollection = require('./childcollection'),
  Base = require('./base'),
  definitions = require('./definitions'),
  Clause = require('./clause'),
  LeafClause = require('./leafclause'),
  debug = require('debug')('models:expression'),
  _ = require('lodash');


/**
 * ExpressionCollection is a collection of Expressions
 * @type {ChildCollection}
 */
var ExpressionCollection = ChildCollection.extend({
  model: function(attrs, options) {
    return new Expression(attrs, options);
  },
  isModel: function(model) {
    return (model instanceof Expression);
  }
});


/**
 * ClauseCollection is a polymorphic collection of clauses
 * and/or expression trees.
 *
 * @type {ChildCollection}
 */
var ClauseCollection = ChildCollection.extend({
  mainIndex: 'id',
  comparator: 'id',
  model: function(attrs, options) {
    if (definitions.treeOperators.indexOf(_.keys(attrs)[0]) !== -1) { // $and, $or, $nor
      return new ExpressionTree(attrs, options);
    } else {
      return new LeafClause(attrs, options);
    }
  },
  isModel: function(model) {
    return (model instanceof Clause);
  }
});


/**
 * ExpressionTree is a container for expressions, combined via a logical
 * operator: $and, $or, $nor.
 *
 * @type {Clause}
 */
var ExpressionTree = module.exports.ExpressionTree = Clause.extend({
  idAttribute: 'id',
  props: {
    operator: {
      type: 'string',
      required: true,
      values: definitions.treeOperators
    }
  },
  session: {
    className: {
      type: 'string',
      default: 'ExpressionTree'
    }
  },
  derived: {
    id: {
      deps: ['operator'],
      fn: function() {
        return this.operator;
      }
    },
    buffer: {
      deps: ['expressions', 'operator'],
      cache: false,
      fn: function() {
        var doc = {};
        doc[this.operator] = this.expressions
          .filter(function(e) {
            return e.valid;
          })
          .map(function(e) {
            return e.buffer;
          });
        return doc;
      }
    },
    valid: {
      deps: ['expressions'],
      cache: false,
      fn: function() {
        return this.expressions.every(function(e) {
          return e.valid;
        });
      }
    }
  },
  collections: {
    expressions: ExpressionCollection
  },
  parse: function(attrs, options) {
    var operator = _.keys(attrs)[0];
    var expressions = attrs[operator];
    return {
      operator: operator,
      expressions: expressions
    };
  },
  serialize: function() {
    return this.buffer;
  }
});


/**
 * Expression is the model wrapping all clauses. It provides the same tree structure as an
 * object, but is not a leaf value object.
 *
 * @type {Base}
 *
 * @property {ClauseCollection} clauses   Collection that maintains all clauses in the expression.
 * @property {boolean} valid              (derived) set to true if the overall expression is valid.
 * @property {object} buffer              contains the full expression as object. read-only.
 */
var Expression = module.exports.Expression = Base.extend({
  session: {
    className: {
      type: 'string',
      default: 'Expression'
    }
  },
  collections: {
    clauses: ClauseCollection
  },
  derived: {
    valid: {
      cache: false,
      deps: ['clauses', 'buffer'],
      fn: function() {
        return this.clauses.every(function(c) {
          return c.valid;
        });
      }
    },
    buffer: {
      cache: false,
      deps: ['clauses'],
      fn: function() {
        return _.assign.apply(null, this.clauses
            .filter(function(c) {
              return c.valid;
            })
            .map(function(c) {
              return c.buffer;
            })
          ) || {};
      }
    }
  },
  parse: function(attrs, options) {
    var result = _.map(attrs, function(v, k) {
      var doc = {};
      doc[k] = v; return doc;
    });
    return {
      clauses: result
    };
  },
  serialize: function() {
    return this.buffer;
  }
});
