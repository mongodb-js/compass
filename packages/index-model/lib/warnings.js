var Triejs = require('triejs');
var Model = require('ampersand-model');
var Collection = require('ampersand-collection');
var _ = require('lodash');
var format = require('util').format;

var WARNINGS = {
  'IXWARN_PREFIX': 1,
  'IXWARN_UNUSED': 2
};

// var debug = require('debug')('mongodb-index-model:warnings-mixin');

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
    });
  }
};

module.exports = {
  mixin: WarningsMixin,
  WARNINGS: WARNINGS,
  WarningModel: WarningModel,
  WarningCollection: WarningCollection
};
