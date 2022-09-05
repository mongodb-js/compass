var View = require('ampersand-view');
var app = require('hadron-app');
var _ = require('lodash');
var ipc = require('hadron-ipc');
const { preferences } = require('compass-preferences-model');

var debug = require('debug')('mongodb-compass:network-optin:index');

var indexTemplate = require('./index.html.tmpl');

var NetworkOptInView = View.extend({
  template: indexTemplate,
  props: {
    trackErrors: ['boolean', true, true],
    enableFeedbackPanel: ['boolean', true, true],
    trackUsageStatistics: ['boolean', true, true],
    autoUpdates: ['boolean', true, true],
    enableMaps: ['boolean', true, true]
  },
  session: {
    buttonTitle: {
      type: 'string',
      required: true,
      default: 'Start using Compass'
    }
  },
  events: {
    'click input[type=checkbox]': 'checkboxChanged',
    'click button[data-hook=start-button]': 'buttonClicked'
  },
  bindings: {
    trackErrors: {
      type: 'booleanAttribute',
      hook: 'track-errors-checkbox',
      name: 'checked'
    },
    enableFeedbackPanel: {
      type: 'booleanAttribute',
      hook: 'product-feedback-checkbox',
      name: 'checked'
    },
    autoUpdates: {
      type: 'booleanAttribute',
      hook: 'auto-updates-checkbox',
      name: 'checked'
    },
    trackUsageStatistics: {
      type: 'booleanAttribute',
      hook: 'usage-stats-checkbox',
      name: 'checked'
    },
    enableMaps: {
      type: 'booleanAttribute',
      hook: 'enable-maps-checkbox',
      name: 'checked'
    },
    buttonTitle: {
      hook: 'start-button'
    }
  },
  initialize: function() {
    this.preferences = preferences;
    if (!preferences.showedNetworkOptIn) {
      // first time, enable all checkboxes (but not features yet)
      debug('first time showing this dialog, propose to turn everything on');
      this.buttonTitle = 'Start Using Compass';
      this.trackErrors = true;
      this.enableFeedbackPanel = true;
      this.trackUsageStatistics = true;
      this.autoUpdates = true;
      this.enableMaps = true;
    } else {
      debug('seen this dialog before, show the real settings');
      this.buttonTitle = 'Close';
      this.trackErrors = preferences.trackErrors;
      this.enableFeedbackPanel = preferences.enableFeedbackPanel;
      this.trackUsageStatistics = preferences.trackUsageStatistics;
      this.autoUpdates = preferences.autoUpdates;
      this.enableMaps = preferences.enableMaps;
    }
  },
  checkboxChanged: function(evt) {
    var feature = evt.target.name;
    var value = evt.target.checked;
    this.set(feature, value);
  },
  buttonClicked: async function() {
    var features = [
      'enableFeedbackPanel',
      'trackUsageStatistics',
      'trackErrors',
      'autoUpdates',
      'enableMaps'
    ];

    const settings = _.pick(this.serialize(), features);
    await this.preferences.save({
      ...settings,
      showedNetworkOptIn: true
    });

    _.delay(function() {
      this.remove();
    }.bind(this), 500);

    {
      // Broadcast the update to telemetry state
      const event = this.preferences.isFeatureEnabled('trackUsageStatistics') ? 'compass:usage:enabled' : 'compass:usage:disabled';
      global.hadronApp.appRegistry.emit(event); // Legacy metrics
      ipc.call(event); // Segment
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    $(this.queryByHook('main-modal')).modal({
      backdrop: 'static',
      keyboard: false
    });
  }
});

module.exports = NetworkOptInView;
