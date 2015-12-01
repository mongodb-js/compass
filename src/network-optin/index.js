var $ = require('jquery');
var View = require('ampersand-view');
var app = require('ampersand-app');
var _ = require('lodash');

var debug = require('debug')('mongodb-compass:feature-optin:index');

require('bootstrap/js/modal');
require('bootstrap/js/transition');

var NAME_TO_FEATURE_MAP = {
  'crashReports': 'bugsnag',
  'productFeedback': 'intercom',
  'usageStats': 'googleAnalytics'
};

var NetworkOptInView = View.extend({
  template: require('./index.jade'),
  props: {
    bugsnag: ['boolean', true, true],
    intercom: ['boolean', true, true],
    googleAnalytics: ['boolean', true, true]
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
    'click button[data-hook=start-button]': 'buttonClicked',
    'click button[data-hook=close-button]': 'buttonClicked'
  },
  bindings: {
    bugsnag: {
      type: 'booleanAttribute',
      hook: 'crash-reports-checkbox',
      name: 'checked'
    },
    intercom: {
      type: 'booleanAttribute',
      hook: 'product-feedback-checkbox',
      name: 'checked'
    },
    googleAnalytics: {
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
      this.bugsnag = true;
      this.intercom = true;
      this.googleAnalytics = true;
    } else {
      debug('seen this dialog before, show the real settings');
      this.buttonTitle = 'Close';
      this.bugsnag = app.preferences.bugsnag;
      this.intercom = app.preferences.intercom;
      this.googleAnalytics = app.preferences.googleAnalytics;
    }
  },
  checkboxChanged: function(evt) {
    var feature = NAME_TO_FEATURE_MAP[evt.target.name];
    var value = evt.target.checked;
    this.set(feature, value);
  },
  buttonClicked: function() {
    var features = ['intercom', 'googleAnalytics', 'bugsnag'];
    this.preferences.set('showedNetworkOptIn', true);
    this.preferences.set(_.pick(this.serialize(), features));
    this.preferences.save(null, {
      success: function(res) {
        debug('preferences saved:', _.pick(res.serialize(),
          features));
      }
    });
    _.delay(function() {
      this.remove();
    }.bind(this), 500);
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
