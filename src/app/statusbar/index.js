var View = require('ampersand-view');
var _ = require('lodash');
var jade = require('jade');
var path = require('path');

var debug = require('debug')('mongodb-compass:statusbar:index');

var indexTemplate = jade.compileFile(path.resolve(__dirname, 'index.jade'));

var StatusbarView = View.extend({
  props: {
    subview: {
      type: 'object',
      default: null
    },
    width: {
      type: 'number',
      default: 0
    },
    message: {
      type: 'string'
    },
    animation: {
      type: 'boolean',
      default: false
    },
    visible: {
      type: 'boolean',
      default: false
    },
    progressbar: {
      type: 'boolean',
      default: true
    }
  },
  session: {
    trickleTimer: 'any'
  },
  derived: {
    /**
     * Outer-bar height.
     */
    height: {
      deps: ['width', 'progressbar'],
      fn: function() {
        if (this.progressbar) {
          return this.width > 0 ? 4 : 0;
        }
        return 0;
      }
    }
  },
  template: indexTemplate,
  bindings: {
    animation: {
      type: 'toggle',
      hook: 'animation',
      mode: 'visibility'
    },
    message: [
      {
        hook: 'message'
      },
      {
        type: 'toggle',
        hook: 'message',
        mode: 'visibility'
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
      }
    ],
    progressbar: {
      type: 'toggle',
      hook: 'outer-bar'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
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
    this.animation = false;
    this.message = 'Fatal Error: ' + err.message;
    this.width = 0;
    this.trickle(false);
    clearInterval(this.trickleTimer);
  },
  trickle: function(bool) {
    if (bool) {
      this.trickleTimer = setInterval(function() {
        this.width = Math.min(98, this.width + 1);
      }.bind(this), 600);
    } else {
      clearInterval(this.trickleTimer);
    }
  },
  show: function(options) {
    options = _.defaults(options || {}, {
      visible: true,
      progressbar: true,
      message: '',
      width: 100,
      animation: false
    });
    debug('options are', options);
    this.set(options);
  },
  showMessage: function(message) {
    this.visible = true;
    this.message = message || '';
    this.animation = false;
  },
  showSubview: function(subview) {
    if (this.subview) {
      this.subview.remove();
    }
    this.subview = subview;
    subview.parent = this;
    this.renderSubview(subview, this.queryByHook('subview-container'));
  },
  hide: function(completed) {
    this.message = '';
    this.animation = false;
    if (this.subview) {
      this.subview.remove();
    }
    clearInterval(this.trickleTimer);
    if (completed) {
      this.width = 100;
      var model = this;
      _.delay(function() {
        model.width = 0;
        model.visible = false;
      }, 500);
    } else {
      this.progressbar = false;
      this.visible = false;
    }
  }
});

module.exports = StatusbarView;
