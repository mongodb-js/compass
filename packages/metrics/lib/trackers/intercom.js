var State = require('ampersand-state');
var _ = require('lodash');
var singleton = require('singleton-js');
var format = require('util').format;
var debug = require('debug')('mongodb-js-metrics:trackers:intercom');
var redact = require('mongodb-redact');
var sentenceCase = require('../shared').sentenceCase;

var os = (typeof window === 'undefined') ?
  require('os') : window.require('remote').require('os');

var IntercomTracker = State.extend({
  id: 'intercom',
  props: {
    appId: ['string', true, ''],    // set through metrics.configure()
    appName: ['string', false],     // set by the App resource
    appVersion: ['string', false],  // set by the App resource
    appStage: ['string', false],    // set by the App resource
    userId: ['string', true, ''],   // set by the User resource
    createdAt: ['date', true],      // set by the User resource
    widget: {
      type: 'object',
      required: true,
      default: function() {
        return {
          activator: '#IntercomDefaultWidget'
        };
      }
    }
  },
  session: {
    intercomHandle: 'any',
    enabled: ['boolean', true, false],
    panelEnabled: {
      type: 'boolean',
      required: true,
      default: false
    },
    hasBooted: ['boolean', true, false]
  },
  derived: {
    enabledAndConfigured: {
      deps: ['enabled', 'panelEnabled', 'appId', 'userId'],
      fn: function() {
        return (this.enabled || this.panelEnabled)
          && this.appId !== '' && this.userId !== '';
      }
    }
  },
  /**
   * Inject the intercom script into the page
   */
  _setup: function() {
    debug('setup intercom');
    var self = this;
    if (typeof window === 'undefined') {
      return;
    }
    var w = window;
    var ic = w.Intercom;
    if (typeof ic === 'function') {
      ic('reattach_activator');
      ic('update', this.serialize());
    } else {
      var d = document;
      var i = function() {
        i.c(arguments);
      };
      i.q = [];
      i.c = function(args) {
        i.q.push(args);
      };
      w.Intercom = i;

      /* eslint no-inner-declarations: 0 */
      function l() {
        var s = d.createElement('script');
        s.type = 'text/javascript';
        s.id = 'intercom-script';
        s.async = true;
        s.src = format('https://widget.intercom.io/widget/%s', self.appId);
        var x = d.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
      }
      if (d.readyState === 'complete') {
        // call directly, window already loaded
        l();
      } else if (w.attachEvent) {
        w.attachEvent('onload', l);
      } else {
        w.addEventListener('load', l, false);
      }
    }
  },
  /**
   * Helper method to remove a DOM node based on its id
   * @param  {String} id    DOM id
   */
  _removeDOMNode: function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.parentNode.removeChild(el);
    }
  },
  /**
   * Call this to remove the intercom panel.
   */
  _teardown: function() {
    debug('teardown intercom');
    if (typeof window === 'undefined') {
      return;
    }
    // remove the intercom widget
    if (window.Intercom) {
      /* eslint new-cap: 0 */
      window.Intercom('hide');
      window.Intercom('shutdown');
    }
    this._removeDOMNode('intercom-container');
    this._removeDOMNode('intercom-script');
    this.hasBooted = false;
  },
  initialize: function() {
    this._updateIntercom = this._updateIntercom.bind(this);
    this._enabledConfiguredChanged = this._enabledConfiguredChanged.bind(this);

    this.on('change:enabledAndConfigured', this._enabledConfiguredChanged);
  },
  _enabledConfiguredChanged: function() {
    if (this.enabledAndConfigured) {
      this._setup();
      this._updateIntercom();
    } else {
      this._teardown();
    }
  },
  /**
   * Configure/Update intercom settings. First call will use the `boot` action
   * subsequent calls the `update` on the Intercom object.
   */
  _updateIntercom: function() {
    var obj = {
      user_id: this.userId,
      created_at: this.createdAt,
      app_name: this.appName,
      app_version: this.appVersion,
      app_stage: this.appStage
    };
    if (typeof os !== 'undefined') {
      obj.host_arch = os.arch();
      obj.host_cpu_cores = os.cpus().length;
      obj.host_cpu_freq_mhz = _.get(os.cpus()[0], 'speed', 'unknown');
      obj.host_total_memory_gb = os.totalmem() / 1024 / 1024 / 1024;
      obj.host_free_memory_gb = os.freemem() / 1024 / 1024 / 1024;
    }
    if (typeof window !== 'undefined') {
      if (!this.hasBooted) {
        obj.app_id = this.appId;
        window.Intercom('boot', obj);
        this.hasBooted = true;
      } else {
        window.Intercom('update', obj);
      }
    }
  },
  /**
   * Attach a callback function on Intercom's `onShow` event.
   * @param  {Function} fn    callback function
   */
  onShow: function(fn) {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.Intercom) {
      /* eslint new-cap: 0 */
      window.Intercom('onShow', fn);
    }
  },
  /**
   * Attach a callback function on Intercom's `onHide` event.
   * @param  {Function} fn    callback function
   */
  onHide: function(fn) {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.Intercom) {
      /* eslint new-cap: 0 */
      window.Intercom('onHide', fn);
    }
  },
  /**
   * Sends an Intercom event with `eventName` and attached metadata
   * @param  {String} eventName    The event name to send to Intercom, this is
   *                               usually `Resource action`, e.g. `App launched`.
   * @param  {Object} metadata     Metadata information with up to 5 keys
   */
  send: function(eventName, metadata) {
    if (!this.enabled) {
      return;
    }
    // redact metadata
    metadata = sentenceCase(redact(metadata));

    debug('sending event `%s` to intercom with metadata %j', eventName, metadata);
    if (typeof window !== 'undefined') {
      window.Intercom('trackEvent', eventName, metadata);
    }
  }
});

module.exports = singleton(IntercomTracker);
