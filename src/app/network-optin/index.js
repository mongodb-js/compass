var $ = window.jQuery;
var View = require('ampersand-view');
var app = require('hadron-app');
var _ = require('lodash');

var debug = require('debug')('mongodb-compass:network-optin:index');

// var indexTemplate = require('./index.jade');
// https://jsonformatter.org/jade-to-html
// https://ampersandjs.com/learn/templates/
const FEEDBACK_OPTIN = `<li>
  <label>
    <input type="checkbox" 
      name="enableFeedbackPanel" 
      data-hook="product-feedback-checkbox" 
      data-test-id="product-feedback-checkbox"/>
    <span>Enable Product Feedback Tool</span>
  </label>
  <p class="option-description">
    Enables a tool for sending feedback or talking to our Product and Development teams directly from Compass.
  </p>
</li>`;

const OPTIN_TEMPLATE = function(context) {
  return `<div class="modal fade" id="networkOptIn" tabindex="-1" role="dialog" data-hook="main-modal" data-test-id="privacy-settings-modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title" data-test-id="modal-title">Privacy Settings</h4>
      </div>
      <div class="modal-body">
        <p>
            To enhance the user experience, Compass can integrate with 3rd party services, 
            which requires external network requests. Please choose from the settings below:
        </p>
        <form>
          <ul>
            ${!context.isCommunity ? FEEDBACK_OPTIN : ''}
            <li>
              <label>
                <input 
                  type="checkbox" 
                  name="enableMaps" 
                  data-hook="enable-maps-checkbox" 
                  data-test-id="enable-maps-checkbox"/>
                  <span>Enable Geographic Visualizations</span>
              </label>
              <p class="option-description">
                Allow Compass to make requests to a 3rd party mapping service.
              </p>
            </li>
            <li>
              <label>
                <input 
                  type="checkbox" 
                  name="trackErrors" 
                  data-hook="track-errors-checkbox" 
                  data-test-id="track-errors-checkbox"/>
                  <span>Enable Crash Reports</span>
              </label>
              <p class="option-description">
                Allow Compass to send crash reports containing stack traces and unhandled exceptions.
              </p>
            </li>
            <li>
              <label>
                <input 
                  type="checkbox" 
                  name="trackUsageStatistics" 
                  data-hook="usage-stats-checkbox" 
                  data-test-id="usage-stats-checkbox"/>
                  <span>Enable Usage Statistics</span>
              </label>
              <p class="option-description">Allow Compass to send anonymous usage statistics.</p>
            </li>
            <li>
              <label>
                <input 
                  type="checkbox" 
                  name="autoUpdates" 
                  data-hook="auto-updates-checkbox" 
                  data-test-id="auto-updates-checkbox"/>
                  <span>Enable Automatic Updates</span>
              </label>
              <p class="option-description">Allow Compass to periodically check for new updates.</p>
            </li>
          </ul>
        </form>
        <p>
          With any of these options, none of your personal information or stored data will be submitted.<br/>
          Learn more:<a href="https://www.mongodb.com/legal/privacy-policy">MongoDB Privacy Policy</a>
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" type="button" data-dismiss="modal" data-hook="start-button" data-test-id="close-privacy-settings-button"></button>
      </div>
    </div>
  </div>
</div>`;
};

var NetworkOptInView = View.extend({
  // template: indexTemplate,
  template: OPTIN_TEMPLATE,
  props: {
    trackErrors: ['boolean', true, true],
    enableFeedbackPanel: ['boolean', true, true],
    trackUsageStatistics: ['boolean', true, true],
    autoUpdates: ['boolean', true, true],
    enableMaps: ['boolean', true, true]
  },
  session: {
    preferences: 'state',
    buttonTitle: {
      type: 'string',
      required: true,
      default: 'Start using Compass'
    },
    isCommunity: {
      type: 'boolean',
      required: true,
      default: process.env.HADRON_PRODUCT === 'mongodb-compass-community'
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
    this.preferences = app.preferences;
    if (!app.preferences.showedNetworkOptIn) {
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
      this.trackErrors = app.preferences.trackErrors;
      this.enableFeedbackPanel = app.preferences.enableFeedbackPanel;
      this.trackUsageStatistics = app.preferences.trackUsageStatistics;
      this.autoUpdates = app.preferences.autoUpdates;
      this.enableMaps = app.preferences.enableMaps;
    }
  },
  checkboxChanged: function(evt) {
    var feature = evt.target.name;
    var value = evt.target.checked;
    this.set(feature, value);
    if (feature === 'trackUsageStatistics' && value !== true) {
      global.hadronApp.appRegistry.emit('compass:usage:disabled');
    }
  },
  buttonClicked: function() {
    var features = [
      'enableFeedbackPanel',
      'trackUsageStatistics',
      'trackErrors',
      'autoUpdates',
      'enableMaps'
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
