var View = require('ampersand-view');
var NProgress = require('nprogress');
var debug = require('debug')('scout:statusbar:index');

var StatusbarView = View.extend({
  props: {
    width: {
      type: 'number',
      default: 100
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
  render: function() {
    this.renderWithTemplate(this);
    NProgress.configure({ parent: '#statusbar', easing: 'ease', speed: 800, trickle: true });
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
  },
  show: function(message) {
    debug('show');
    NProgress.start()
    this.message = message || '';
    // this.width = 100;
    this.loading = true;
  },
  inc: function(val) {
    NProgress.inc(val);
    debug('NProgress', NProgress);
  },
  trickle: function(bool) {
    NProgress.configure({ trickle: bool });
  },
  status: function() {
    return NProgress.status;
  },
  hide: function() {
    NProgress.set(1);
    _.delay(function() {
      NProgress.done();
    }, 800);
    this.message = '';
    // this.width = 0;
    this.loading = false;
  }
});

module.exports = StatusbarView;
