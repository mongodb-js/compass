var AmpersandView = require('ampersand-view');
var numeral = require('numeral');

var CollectionStatsView = AmpersandView.extend({
  bindings: {
    'model.name': {
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
    },
  },
  derived: {
    document_count: {
      deps: ['model.document_count'],
      fn: function() {
        return numeral(this.model.document_count).format('0.0a');
      }
    },
    document_size: {
      deps: ['model.document_size'],
      fn: function() {
        return numeral(this.model.document_size).format('0.0b');
      }
    },
    document_size_average: {
      deps: ['model.document_size_average'],
      fn: function() {
        return numeral(this.model.document_size_average).format('0.0b');
      }
    },
    index_count: {
      deps: ['model.index_count'],
      fn: function() {
        return numeral(this.model.index_count).format('0.0a');
      }
    },
    index_size: {
      deps: ['model.index_size'],
      fn: function() {
        return numeral(this.model.index_size).format('0.0b');
      }
    },
    index_size_average: {
      deps: ['model.index_size_average'],
      fn: function() {
        return numeral(this.model.index_size_average).format('0.0b');
      }
    }
  },
  template: require('./index.jade')
});

module.exports = CollectionStatsView;
