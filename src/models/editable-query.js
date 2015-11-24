var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');
var Query = require('mongodb-language-model').Query;
var _ = require('lodash');
// var debug = require('debug')('mongodb-compass:models:editable-query');

/**
 * Editable Query, for the Refine Bar. Wrapper around a string with cleanup and validation.
 */
module.exports = Model.extend({
  props: {
    rawString: {
      type: 'string',
      default: '{}',
      required: true
    },
    _queryObject: {
      type: 'object',
      default: null
    }
  },
  derived: {
    cleanString: {
      deps: ['rawString'],
      fn: function() {
        var output = this.rawString;
        // accept whitespace-only input as empty query
        if (_.trim(output) === '') {
          output = '{}';
        }
        // wrap field names in double quotes. I appologize for the next line of code.
        // @see http://stackoverflow.com/questions/6462578/alternative-to-regex-match-all-instances-not-inside-quotes
        // @see https://regex101.com/r/xM7iH6/1
        output = output.replace(/([{,])\s*([^,{\s\'"]+)\s*:(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g, '$1"$2":');
        // replace multiple whitespace with single whitespace
        output = output.replace(/\s+/g, ' ');
        return output;
      }
    },
    // @todo
    // displayString: {
    //   deps: ['cleanString'],
    //   fn: function() {
    //     // return the string without key quotes for display in RefineBarView
    //   }
    // },
    /* eslint no-new: 0 */
    valid: {
      deps: ['cleanString'],
      fn: function() {
        try {
          // is it valid eJSON?
          var parsed = EJSON.parse(this.cleanString);
          // is it a valid parsable Query according to the language?
          this._queryObject = new Query(parsed, {
            parse: true
          });
        } catch (e) {
          this._queryObject = null;
          return false;
        }
        return true;
      }
    },
    queryObject: {
      deps: ['_queryObject'],
      fn: function() {
        return this._queryObject;
      }
    }
  }
});
