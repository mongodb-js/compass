var $ = require('jquery');
var View = require('ampersand-view');
var app = require('ampersand-app');
var _ = require('lodash');
var metrics = require('mongodb-js-metrics')();

var debug = require('debug')('mongodb-compass:feature-optin:index');

var indexTemplate = require('./index.jade');

require('bootstrap/js/modal');
require('bootstrap/js/transition');

var NetworkOptInView = View.extend({
  template: indexTemplate,
  props: {
    trackErrors: ['boolean', true, true],
    enableFeedbackPanel: ['boolean', true, true],
    trackUsageStatistics: ['boolean', true, true],
    autoUpdates: ['boolean', true, true]
  },
  session: {
    preferences: 'state',
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
    buttonTitle: {
      hook: 'start-button'
    }
  },
  initialize: function() {
    this.preferences = app.preferences;
    if (!app.preferences.showedNetworkOptIn) {
      // first time, enable all checkboxes (but not features yet)
      debug('first time showing this dialog, propose to turn everything on');
      this.buttonTitle = 'Start Using Compass';
      this.trackErrors = true;
      this.enableFeedbackPanel = true;
      this.trackUsageStatistics = true;
      this.autoUpdates = true;
    } else {
      debug('seen this dialog before, show the real settings');
      this.buttonTitle = 'Close';
      this.trackErrors = app.preferences.trackErrors;
      this.enableFeedbackPanel = app.preferences.enableFeedbackPanel;
      this.trackUsageStatistics = app.preferences.trackUsageStatistics;
      this.autoUpdates = app.preferences.autoUpdates;
    }
  },
  checkboxChanged: function(evt) {
    var feature = evt.target.name;
    var value = evt.target.checked;
    this.set(feature, value);
  },
  buttonClicked: function() {
    var features = [
      'enableFeedbackPanel',
      'trackUsageStatistics',
      'trackErrors',
      'autoUpdates'
    ];

    this.preferences.set('showedNetworkOptIn', true);
    var settings = _.pick(this.serialize(), features);
    this.preferences.set(settings);
    this.preferences.save(null, {
      success: function(res) {
        debug('preferences saved:', _.pick(res.serialize(),
          features));
      }
    });
    _.delay(function() {
      this.remove();
    }.bind(this), 500);
    var metadata = {
      'track usage stats': settings.trackUsageStatistics,
      'product feedback': settings.enableFeedbackPanel,
      'track errors': settings.trackErrors,
      'auto updates': settings.autoUpdates
    };
    metrics.track('Network Opt-in', 'used', metadata);
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
