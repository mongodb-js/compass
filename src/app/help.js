/* eslint no-console:0 */
var path = require('path');
var resourcePath = path.join(__dirname, '..', '..');

var ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

var pkg = require('../../package.json');
var CompileCache = require('hadron-compile-cache');
CompileCache.setHomeDirectory(resourcePath);
CompileCache.digestMappings = pkg._compileCacheMappings || {};

require('../setup-hadron-distribution');

/**
 * The styles are rendered into the head of the index.html and help.html
 * as part of the build process so the style manager is not needed in
 * production.
 */
if (process.env.NODE_ENV !== 'production') {
  /**
   * @note: Style Manager should get set up first so styles are in place before
   * the packages are activated.
   */
  var setup = require('./setup-style-manager');
  setup('help.less');
}

/**
 * The main entrypoint for the application!
 */
var electron = require('electron');
var shell = electron.shell;
var app = require('hadron-app');
var APP_VERSION = electron.remote.app.getVersion();

var _ = require('lodash');
var qs = require('qs');
var ViewSwitcher = require('ampersand-view-switcher');
var View = require('ampersand-view');
var localLinks = require('local-links');
var ipc = require('hadron-ipc');
var Router = require('./help/router');
var metrics = require('mongodb-js-metrics')();

var addInspectElementMenu = require('debug-menu').install;

ipc.once('app:launched', function() {
  console.log('in app:launched');
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

var debug = require('debug')('mongodb-compass:help');

var Application = View.extend({
  template: function() {
    return [
      '<div id="application">',
      '  <div data-hook="layout-container"></div>',
      '</div>'
    ].join('\n');
  },
  props: {
    version: {
      type: 'string',
      default: APP_VERSION
    }
  },
  session: {
    /**
     * Details of the MongoDB Instance we're currently connected to.
     */
    instance: 'state',
    /**
     * @see http://learn.humanjavascript.com/react-ampersand/creating-a-router-and-pages
     */
    router: 'object'
  },
  events: {
    'click a': 'onLinkClick'
  },
  onClientReady: function() {
    this.startRouter();
  },
  startRouter: function() {
    this.router = new Router();
    debug('Listening for page changes from the router...');
    this.listenTo(this.router, 'page', this.onPageChange);

    debug('Starting router...');
    this.router.history.start({
      pushState: false,
      root: '/'
    });
  },
  /**
   * When you want to go to a different page in the app or just save
   * state via the URL.
   * @param {String} fragment - To update the location bar with.
   * @param {Object} [options] - `silent` and `params`
   */
  navigate: function(fragment, options) {
    options = _.defaults(options || {}, {
      silent: false,
      params: null
    });
    if (options.params) {
      fragment += '?' + qs.stringify(options.params);
    }

    var hash = fragment.charAt(0) === '/' ? fragment.slice(1) : fragment;
    this.router.history.navigate(hash, {
      trigger: !options.silent
    });
  },
  /**
   * Called a soon as the DOM is ready so we can
   * start showing status indicators as
   * quickly as possible.
   */
  render: function() {
    debug('Rendering app container...');

    this.el = document.querySelector('#application');
    this.renderWithTemplate(this);
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('layout-container'), {
      show: function() {
        document.scrollTop = 0;
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      debug('Installing "Inspect Element" context menu');
      addInspectElementMenu();
    }
  },
  onPageChange: function(view) {
    metrics.track('App', 'viewed', view.screenName);
    this.pageSwitcher.set(view);
  },
  onLinkClick: function(event) {
    // ignore help links, they're handled in `onHelpClicked`
    if (event.target.className === 'help') {
      return;
    }
    var pathname = localLinks.getLocalPathname(event);
    if (pathname) {
      event.preventDefault();
      this.router.history.navigate(pathname);
      return;
    } else if (event.currentTarget.getAttribute('href') !== '#') {
      event.preventDefault();
      event.stopPropagation();
      shell.openExternal(event.target.href);
    }
  }
});

var state = new Application({});

app.extend({
  client: null,
  navigate: state.navigate.bind(state),
  onDomReady: function() {
    state.render();
    // Not serving a part of the app which uses the client,
    // so we can just start everything up now.
    state.startRouter();
    return;
  },
  init: function() {
    var self = this;
    // signal to main process that app is ready
    ipc.call('window:renderer-ready');
    // as soon as dom is ready, render and set up the rest
    self.onDomReady();
  }
});

Object.defineProperty(app, 'instance', {
  get: function() {
    return state.instance;
  }
});

Object.defineProperty(app, 'router', {
  get: function() {
    return state.router;
  }
});

Object.defineProperty(app, 'state', {
  get: function() {
    return state;
  }
});

app.init();

window.app = app;
