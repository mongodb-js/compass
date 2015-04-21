// ## Main entrypoint
//
// This is where everything gets wired together.
window.jQuery = window.$ = require('jquery');

require('phantomjs-polyfill');

var AmpersandState = require('ampersand-state'),
  AmpersandView = require('ampersand-view'),
  assert = require('assert'),
  domReady = require('domready'),
  ViewSwitcher = require('ampersand-view-switcher'),
  qs = require('qs');

var app = require('ampersand-app');
var Router = require('./router');

var PageContainer = AmpersandView.extend({
  template: '<body><div class="page-container" data-hook="page-container"></div></body>',
  initialize: function() {
    this.listenTo(app.router, 'page', this.onPageChange);
  },
  events: {
    'click a': 'onLinkClick'
  },
  render: function() {
    this.renderWithTemplate({});
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('page-container'), {
      show: function() {
        document.scrollTop = 0;
      }
    });
    return this;
  },
  onPageChange: function(view) {
    this.pageSwitcher.set(view);
    app.currentPage = view;
  },
  onLinkClick: function(e) {
    if (e && e.hasOwnProperty('isPropagationStopped') && e.isPropagationStopped()) return;

    var aTag = e.delegateTarget;
    var local = aTag.host === window.location.host;

    // if it's a plain click (no modifier keys)
    // and it's a local url, navigate internally
    if (local && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      app.navigate(aTag.pathname + aTag.search);
    }
  }
});

var StatusbarView = require('./statusbar');
app.extend({
  /**
   * init URL handlers and the history tracker.
   */
  router: new Router(),
  statusbar: new StatusbarView(),
  currentPage: null,
  init: function() {
    domReady(function() {
      app.view = new PageContainer({
        el: document.body
      }).render();

      // we have what we need, we can now start our router and show the
      // appropriate page!
      app.router.history.start({
        pushState: false,
        root: '/'
      });
    });
  },
  _toHash: function(fragment) {
    return (fragment.charAt(0) === '/') ? fragment.slice(1) : fragment;
  },
  /**
   * When you want to go to a different page in the app.
   */
  navigate: function(fragment) {
    this.router.history.navigate(this._toHash(fragment), {
      trigger: true
    });
  },
  /**
   * Update the URL in the location bar and add a new history entry,
   * but don't bubble up to the router.  Required if your view is updating
   * the page state (e.g. selected items).
   */
  url: function(fragment, data) {
    if (data) {
      fragment += '?' + qs.stringify(data);
    }
    this.router.history.navigate(this._toHash(fragment), {
      trigger: false
    });
  },
  permalink: function(fragment) {
    var origin = window.location.origin;
    return origin + '/#' + this._toHash(fragment);
  }
});

module.exports = app.init();
