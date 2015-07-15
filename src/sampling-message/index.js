var View = require('ampersand-view');
var pluralize = require('pluralize');
var format = require('util').format;
var app = require('ampersand-app');

var SamplingMessageView = View.extend({
  session: {
    parent: 'state'
  },
  bindings: {
    sample_size_message: {
      hook: 'sample_size_message'
    },
    is_sample: [
      {
        hook: 'is_sample',
        type: 'booleanClass',
        no: 'hidden'
      },
      {
        hook: 'is_query',
        type: 'booleanClass',
        yes: 'hidden'
      }
    ]
  },
  props: {
    schema_sample_size: {
      type: 'number',
      default: 0
    }
  },
  derived: {
    is_sample: {
      deps: ['schema_sample_size'],
      fn: function() {
        return this.schema_sample_size === app.queryOptions.limit;
      }
    },
    sample_size_message: {
      deps: ['schema_sample_size'],
      fn: function() {
        return format('%d %s', this.parent.schema.sample_size,
          pluralize('document', this.parent.schema.sample_size));
      }
    }
  },
  template: require('./index.jade'),
  initialize: function() {
    this.listenTo(this.parent.schema, 'change:sample_size',
      this.onSampleSizeUpdated);
  },
  onSampleSizeUpdated: function() {
    this.schema_sample_size = this.parent.schema.sample_size;
  }
});
module.exports = SamplingMessageView;
