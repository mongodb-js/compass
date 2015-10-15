var View = require('ampersand-view');
var debug = require('debug')('scout:statusbar:index');

var StatusbarView = View.extend({
  props: {
    trickleTimer: 'any',
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
    // view.listenTo(collection, 'sync', this.onComplete.bind(this));
    // view.listenTo(collection, 'request', this.onRequest.bind(this));
    return this;
  },
  unwatch: function(view, collection) {
    // view.stopListening(collection, 'sync', this.onComplete.bind(this));
    // view.stopListening(collection, 'request', this.onRequest.bind(this));
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
    clearInterval(this.trickleTimer);
  },
  trickle: function(bool) {
    if (bool) {
      this.trickleTimer = setInterval(function() {
        var inc = _.random(1, 5);
        this.width = Math.min(96, this.width + inc);
      }.bind(this), 800);
    } else {
      clearInterval(this.trickleTimer);
    }
  },
  show: function(message) {
    this.message = message || '';
    this.width = 100;
    this.loading = true;
  },
  hide: function() {
    this.width = 100;
    this.message = '';
    this.loading = false;
    clearInterval(this.trickleTimer);
    var model = this;
    _.delay(function() {
      model.width = 0;
    }, 1000);
  }
});

module.exports = StatusbarView;
