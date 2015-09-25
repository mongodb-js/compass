var View = require('ampersand-view');
var StatusbarView = View.extend({
  props: {
    width: {
      type: 'number',
      default: 0
    },
    message: {
      type: 'string'
    },
    loading: {
      type: 'boolean',
      default: true
    }
  },
  template: require('./index.jade'),
  bindings: {
    loading: {
      hook: 'loading',
      type: 'booleanClass',
      yes: 'visible',
      no: 'hidden'
    },
    message: [
      {
        hook: 'message'
      },
      {
        hook: 'message-container',
        type: 'booleanClass',
        no: 'hidden'
      }
    ],
    height: {
      hook: 'outer-bar',
      type: function(el, value) {
        el.style.height = value + 'px';
      }
    },
    width: [
      {
        hook: 'inner-bar',
        type: function(el, value) {
          el.style.width = value + '%';
        }
      },
      {
        type: 'booleanClass',
        no: 'hidden'
      }
    ]
  },
  derived: {
    /**
     * Outer-bar height.
     */
    height: {
      deps: ['width'],
      fn: function() {
        return this.width > 0 ? 4 : 0;
      }
    }
  },
  watch: function(view, collection) {
    view.listenTo(collection, 'sync', this.onComplete.bind(this));
    view.listenTo(collection, 'request', this.onRequest.bind(this));
    return this;
  },
  unwatch: function(view, collection) {
    view.stopListening(collection, 'sync', this.onComplete.bind(this));
    view.stopListening(collection, 'request', this.onRequest.bind(this));
    return this;
  },
  onRequest: function(model, resp, options) {
    options = options || {};
    this.show(options.message);
  },
  onComplete: function() {
    this.hide();
  },
  fatal: function(err) {
    this.loading = false;
    this.message = 'Fatal Error: ' + err.message;
    this.width = 100;
  },
  show: function(message) {
    this.message = message || '';
    this.width = 100;
    this.loading = true;
  },
  hide: function() {
    this.message = '';
    this.width = 0;
    this.loading = false;
  }
});

module.exports = StatusbarView;
