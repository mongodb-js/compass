var View = require('ampersand-view');
var pluralize = require('pluralize');
var numeral = require('numeral');

var indexTemplate = require('../templates')['sampling-message'].index;

// var debug = require('debug')('mongodb-compass:sampling-message');

var SamplingMessageView = View.extend({
  template: indexTemplate,
  session: {
    parent: 'state'
  },
  props: {
    sample_size: {
      type: 'number',
      default: 0
    },
    total_count: {
      type: 'number',
      default: 0
    }
  },
  derived: {
    visible: {
      deps: ['sample_size'],
      fn: function() {
        return this.sample_size > 0 || !this.model;
      }
    },
    percentage: {
      deps: ['sample_size', 'total_count'],
      fn: function() {
        if (this.total_count === 0) {
          return '0%';
        }
        return numeral(this.sample_size / this.total_count).format('0.00%');
      }
    },
    is_sample: {
      deps: ['sample_size', 'total_count'],
      fn: function() {
        return this.model && (this.sample_size < this.total_count);
      }
    },
    formatted_total_count: {
      deps: ['total_count'],
      fn: function() {
        return numeral(this.total_count).format('0,0');
      }
    },
    formatted_sample_size: {
      deps: ['sample_size'],
      fn: function() {
        return numeral(this.sample_size).format('0,0');
      }
    },
    total_count_document: {
      deps: ['total_count'],
      fn: function() {
        return pluralize('document', this.total_count);
      }
    },
    sample_size_document: {
      deps: ['sample_size'],
      fn: function() {
        return pluralize('document', this.sample_size);
      }
    }
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  initialize: function() {
    if (this.model) {
      this.listenTo(this.model, 'request', this.hide.bind(this));
      this.listenTo(this.model, 'sync', this.show.bind(this));
    }
  },
  hide: function() {
    this.sample_size = 0;
    this.total_count = 0;
  },
  show: function() {
    this.sample_size = this.model.sample_size;
    this.total_count = this.model.total;
    this.render();
  },
  render: function() {
    this.renderWithTemplate(this);
  }
});
module.exports = SamplingMessageView;
