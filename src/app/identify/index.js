var $ = require('jquery');
var View = require('ampersand-view');
var metrics = require('mongodb-js-metrics')();
var app = require('ampersand-app');
var ipc = require('hadron-ipc');

// var debug = require('debug')('mongodb-compass:identify:index');

module.exports = View.extend({
  template: require('./index.jade'),
  events: {
    'input input[name=name]': 'onNameInputChanged',
    'change input[name=name]': 'onNameInputChanged',
    'input input[name=email]': 'onEmailInputChanged',
    'change input[name=email]': 'onEmailInputChanged',
    'input input[name=twitter]': 'onTwitterInputChanged',
    'change input[name=twitter]': 'onTwitterInputChanged',
    'click [data-hook=start-button]': 'onStartClicked',
    'click [data-hook=cancel-button]': 'onCancelClicked'
  },
  props: {
    name: ['string', true, ''],
    email: ['string', true, ''],
    twitter: ['string', true, '']
  },
  derived: {
    valid: {
      deps: ['name', 'email'],
      fn: function() {
        return Boolean(this.name && this.email.match(/.+\@.+\..+/));
      }
    }
  },
  bindings: {
    valid: {
      type: 'booleanAttribute',
      hook: 'start-button',
      no: 'disabled'
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    $(this.queryByHook('main-modal')).modal({
      backdrop: 'static',
      keyboard: false
    });
  },
  onNameInputChanged: function(evt) {
    this.name = evt.target.value;
  },
  onEmailInputChanged: function(evt) {
    this.email = evt.target.value;
  },
  onTwitterInputChanged: function(evt) {
    this.twitter = evt.target.value;
  },
  onCancelClicked: function() {
    // code to close current connection window and open connect dialog
    ipc.call('app:show-connect-window');
    window.close();
  },
  onStartClicked: function() {
    if (!this.valid) {
      return;
    }
    // set user model, send to intercom/mixpanel
    var info = {
      name: this.name,
      email: this.email,
      twitter: this.twitter
    };
    app.user.save(info);
    metrics.resources.get('User').set(info);
    metrics.trackers.get('intercom')._updateIntercom();
    this.triggerStage1();
  },
  triggerStage1: function() {
    // trigger treasure hunt `stage1` event
    metrics.track('Treasure Hunt', 'stage1');
  }
});
