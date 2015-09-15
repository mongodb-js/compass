var View = require('ampersand-view');
var pluralize = require('pluralize');
var format = require('util').format;
var app = require('ampersand-app');

var SamplingMessageView = View.extend({
  session: {
    parent: 'state'
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
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
    visible: {
      deps: ['schema_sample_size'],
      fn: function() {
        return this.schema_sample_size > 0;
      }
    },
    is_sample: {
      deps: ['schema_sample_size'],
      fn: function() {
        return this.schema_sample_size === app.queryOptions.size;
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
    this.listenTo(this.parent.schema, 'request', this.hide.bind(this));
    this.listenTo(this.parent.schema, 'sync', this.show.bind(this));
  },
  hide: function() {
    this.schema_sample_size = 0;
  },
  show: function() {
    this.schema_sample_size = this.parent.schema.sample_size;
  }
});
module.exports = SamplingMessageView;
