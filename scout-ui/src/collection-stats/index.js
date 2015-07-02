var AmpersandView = require('ampersand-view');
var numeral = require('numeral');

var CollectionStatsView = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    },
    document_count: {
      hook: 'document_count'
    },
    document_size: {
      hook: 'document_size'
    },
    document_size_average: {
      hook: 'document_size_average'
    },
    index_count: {
      hook: 'index_count'
    },
    index_size: {
      hook: 'index_size'
    },
    index_size_average: {
      hook: 'index_size_average'
    }
  },
  /**
   * Use [numeral.js][numeral.js] to format a collection stat as a nice string.
   * @param {String} propertyName of `this.model` to format as a string.
   * @return {String} Nicely formatted value.
   * [numeral.js]: http://numeraljs.com/
   */
  format: function(propertyName) {
    var value = this.model.get(propertyName);
    var precision = value <= 1000 ? '0' : '0.0';
    var format = propertyName.indexOf('_size') > -1 ? 'b' : 'a';
    return numeral(value).format(precision + format);
  },
  derived: {
    document_count: {
      deps: ['model.document_count'],
      fn: function() {
        return this.format('document_count');
      }
    },
    document_size: {
      deps: ['model.document_size'],
      fn: function() {
        return this.format('document_size');
      }
    },
    document_size_average: {
      deps: ['model.document_size_average'],
      fn: function() {
        return this.format('document_size_average');
      }
    },
    index_count: {
      deps: ['model.index_count'],
      fn: function() {
        return this.format('index_count');
      }
    },
    index_size: {
      deps: ['model.index_size'],
      fn: function() {
        return this.format('index_size');
      }
    },
    index_size_average: {
      deps: ['model.index_size_average'],
      fn: function() {
        return this.format('index_size_average');
      }
    }
  },
  template: require('./index.jade')
});

module.exports = CollectionStatsView;
