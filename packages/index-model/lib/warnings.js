var Triejs = require('triejs');
var Model = require('ampersand-model');
var Collection = require('ampersand-collection');
var _ = require('lodash');
var format = require('util').format;

var WARNINGS = {
  'IXWARN_PREFIX': 1,
  'IXWARN_UNUSED': 2,
  'IXWARN_KEY_PATTERN': 3
};

// var debug = require('debug')('mongodb-index-model:warnings-mixin');

/**
 * List of valid values for an index.
 *
 * See https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#db.collection.createIndex
 * See https://docs.mongodb.com/manual/release-notes/3.4-compatibility/#stricter-validation-of-index-specifications
 *
 * @type {string[]}
 */
var VALID_INDEX_TYPE_VALUES = [1, -1, '2dsphere', '2d', 'geoHaystack', 'text', 'hashed', 'wildcard'];

var WarningModel = Model.extend({
  idAttribute: 'code',
  props: {
    code: {
      type: 'number',
      required: true,
      values: _.values(WARNINGS)
    },
    message: {
      type: 'string',
      required: true,
      default: ''
    },
    details: {
      type: 'string'
    }
  }
});

var WarningCollection = Collection.extend({
  model: WarningModel
});

/**
 * Mixin for IndexCollection.
 *
 * Call updateIndexWarnings() to update warnings for all indexes based on
 * the current collection of indexes. Currently, this has to be done manually.
 */
var WarningsMixin = {
  /**
   * create index definition string based on keys and values, joined by `_`
   * @param  {Index} idx  - index
   * @return {Sting}      - definition string, e.g. bar_-1_foo_hashed
   */
  _getDefinitionString: function(idx) {
    return _.flatten(_.toPairs(idx.key)).join('_');
  },
  addWarningToIndex: function(warningCode, idx, meta) {
    switch (warningCode) {
      case WARNINGS.IXWARN_PREFIX:
        idx.warnings.add(new WarningModel({
          code: warningCode,
          message: 'Prefix of Another Index',
          details: format('This index is a prefix of index "%s" and might therefore'
            + 'be redundant. See https://docs.mongodb.org/manual/core/index-'
            + 'compound/#prefixes for more information.', meta.otherIndex.name)
        }));
        break;
      case WARNINGS.IXWARN_UNUSED:
        idx.warnings.add(new WarningModel({
          code: warningCode,
          message: 'Unused Index',
          details: 'This index has never been used and might therefore not be required.'
        }));
        break;
      case WARNINGS.IXWARN_KEY_PATTERN:
        idx.warnings.add(new WarningModel({
          code: warningCode,
          message: 'Index Key Pattern is not valid',
          details: 'This index has a key pattern that may not be valid in MongoDB 3.4 and later.' +
          'See https://docs.mongodb.com/manual/release-notes/3.4-compatibility/' +
          '#stricter-validation-of-index-specifications for more information.'
        }));
        break;
      default:
        throw new Error('Index warning code %i unknown.');
    }
  },
  updateIndexWarnings: function() {
    var trie = new Triejs();
    var collection = this;

    // build trie data structure
    collection.each(function(idx) {
      trie.add(collection._getDefinitionString(idx), idx);
    });

    // check for issues and attach warnings to indexes
    collection.each(function(idx) {
      // check for indexes with idx as prefix
      var idxDefStr = collection._getDefinitionString(idx);
      var dupes = _.without(trie.find(idxDefStr), idx);
      if (idx.name !== '_id_' && dupes.length > 0) {
        collection.addWarningToIndex(WARNINGS.IXWARN_PREFIX, idx, {
          otherIndex: dupes[0]
        });
      } else {
        idx.warnings.remove(WARNINGS.IXWARN_PREFIX);
      }
      // check for unused indexes
      if (idx.name !== '_id_' && idx.usageCount === 0) {
        collection.addWarningToIndex(WARNINGS.IXWARN_UNUSED, idx, {});
      } else {
        idx.warnings.remove(WARNINGS.IXWARN_UNUSED);
      }

      // Check for potentially invalid values, e.g. Boolean true, 0, NaN, or
      // arbitrary strings that are not special like '2d' or 'geoHaystack'
      _.values(idx.key).forEach(function(value) {
        if (!_.includes(VALID_INDEX_TYPE_VALUES, value)) {
          collection.addWarningToIndex(WARNINGS.IXWARN_KEY_PATTERN, idx, {});
        }
      });
    });
  }
};

module.exports = {
  mixin: WarningsMixin,
  WARNINGS: WARNINGS,
  WarningModel: WarningModel,
  WarningCollection: WarningCollection
};
