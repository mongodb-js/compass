var View = require('ampersand-view');
var _ = require('lodash');
// var debug = require('debug')('scout:statusbar:index');

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
    loadingIndicator: {
      type: 'boolean',
      default: true
    },
    visible: {
      type: 'boolean',
      default: false
    }
  },
  template: require('./index.jade'),
  bindings: {
    loadingIndicator: {
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
        hook: 'outer-bar',
        no: 'hidden'
      }
    ],
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
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
    this.visible = true;
    this.loadingIndicator = false;
    this.message = 'Fatal Error: ' + err.message;
    this.width = 0;
    this.trickle(false);
    clearInterval(this.trickleTimer);
  },
  trickle: function(bool) {
    if (bool) {
      this.trickleTimer = setInterval(function() {
        this.width = Math.min(98, this.width + _.random(1, 3));
      }.bind(this), 800);
    } else {
      clearInterval(this.trickleTimer);
    }
  },
  show: function(message) {
    this.visible = true;
    this.message = message || '';
    this.width = 100;
    this.loadingIndicator = true;
  },
  hide: function(completed) {
    this.message = '';
    this.loadingIndicator = false;
    clearInterval(this.trickleTimer);
    if (completed) {
      this.width = 100;
      var model = this;
      _.delay(function() {
        model.width = 0;
        model.visible = false;
      }, 1000);
    } else {
      this.width = 0;
      this.visible = false;
    }
  }
});

module.exports = StatusbarView;
