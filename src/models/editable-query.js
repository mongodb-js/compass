var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');
var Query = require('mongodb-language-model').Query;
var _ = require('lodash');

// var debug = require('debug')('scout:models:editable-query');

/**
 * Editable Query, for the Refine Bar. Wrapper around a string with cleanup and validation.
 */
module.exports = Model.extend({
  props: {
    rawString: {
      type: 'string',
      default: '{}',
      required: true
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
        // replace single quotes with double quotes
        output = output.replace(/'/g, '"');
        // wrap field names in double quotes
        output = output.replace(/([{,])\s*([^,{\s\'"]+)\s*:/g, ' $1 "$2" : ');
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
    valid: {
      deps: ['cleanString'],
      fn: function() {
        /*eslint no-new: 0*/
        try {
          // is it valid eJSON?
          var queryObj = EJSON.parse(this.cleanString);
          // is it a valid parsable Query according to the language?
          new Query(queryObj, {
            parse: true
          });
        } catch (e) {
          return false;
        }
        return true;
      }
    }
  }
});
