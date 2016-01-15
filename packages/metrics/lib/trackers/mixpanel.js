var State = require('ampersand-state');
var _ = require('lodash');
var singleton = require('singleton-js');
var redact = require('mongodb-redact');
var sentenceCase = require('../shared').sentenceCase;

var debug = require('debug')('mongodb-js-metrics:trackers:mixpanel');


var MixpanelTracker = State.extend({
  id: 'mixpanel',
  // super properties (always sent to mixpanel)
  props: {
    appName: ['string', false],            // set by App resource
    appVersion: ['string', false],         // set by App resource
    appStage: ['string', false],           // set by App resource
    appPlatform: ['string', false],        // set by App resource

    hostArchitecture: ['string', false],   // set by Host resource
    hostCPUCores: ['number', false],       // set by Host resource
    hostCPUFreqMHz: ['number', false],     // set by Host resource
    hostMemoryTotalGB: ['number', false],  // set by Host resource
    hostMemoryFreeGB: ['number', false]    // set by Host resource
  },
  // these are not sent to mixpanel, just used internally
  session: {
    mixpanelHandler: ['object', false, null],
    enabled: ['boolean', true, false],
    apiToken: ['string', true, ''],      // set through metrics.configure()
    userId: ['string', true, ''],        // set by User resource
    createdAt: ['date', true]            // set by User resource
  },
  derived: {
    enabledAndConfigured: {
      deps: ['enabled', 'apiToken', 'userId'],
      fn: function() {
        return this.enabled && this.apiToken !== '' && this.userId !== '';
      }
    }
  },
  initialize: function() {
    this._configureMixpanel = this._configureMixpanel.bind(this);

    // when any of the properties change, re-configure mixpanel handler
    this.on('change', this._configureMixpanel);
  },
  /**
   * configure the mixpanel handler based on props and derived props. Called
   * whenever a property changes.
   */
  _configureMixpanel: function() {
    if (this.enabledAndConfigured) {
      if (typeof window === 'undefined') {
        return;
      }
      if (!this.mixpanelHandler) {
        this.mixpanelHandler = require('mixpanel-browser');
        this.mixpanelHandler.init(this.apiToken);
      }
      var options = sentenceCase(_.omit(this.serialize({
        props: true,
        derived: false,
        session: false
      }), _.isEmpty));
      this.mixpanelHandler.register(options);
      // for privacy purposes, overwrite the current url field, because it
      // contains information about the username and database/collection names
      this.mixpanelHandler.register_once({
        $current_url: 'index.html'
      });
      this.mixpanelHandler.identify(this.userId);
      this.mixpanelHandler.people.set_once({
        '$created': this.createdAt
      });
    }
  },
  /**
   * Method to manually send events to mixpanel. Metadata is redacted before
   * sent to mixpanel.
   *
   * @param {Error}  eventName  name of the event to send, e.g. "Schema sampled"
   * @param {Object} metadata   Metadata can be attached, @see https://mixpanel.com/help/reference/javascript
   */
  send: function(eventName, metadata, callback) {
    if (!this.enabled) {
      if (callback) {
        return callback(null, false);
      }
      /* eslint consistent-return:0 */
      return;
    }
    debug('sending event `%s` to mixpanel with metadata %j', eventName, metadata);
    this.mixpanelHandler.track(eventName, redact(metadata), callback);
  }
});

module.exports = singleton(MixpanelTracker);
