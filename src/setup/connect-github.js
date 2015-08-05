var View = require('ampersand-view');
var app = require('ampersand-app');
var metrics = require('../metrics');

var debug = require('debug')('scout:setup:connect-github');

module.exports = View.extend({
  events: {
    'click [data-hook=connect-github]': 'onGithubClicked',
    'click [data-hook=skip]': 'onSkipClicked'
  },
  template: require('./connect-github.jade'),
  onGithubClicked: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    metrics.track('Connect with GitHub started');
    app.ipc.once('github-oauth-flow-error', function(err) {
      if (err.cancelled) {
        metrics.track('Connect with GitHub cancelled');
      } else {
        metrics.trackError(err);
      }
      this.parent.step++;
    }.bind(this));

    app.ipc.once('github-oauth-flow-complete', function(data) {
      metrics.track('Connect with GitHub complete');

      app.user.set(data);
      app.user.save();

      this.parent.name = data.name;
      this.parent.email = data.email;
      this.parent.step++;
    }.bind(this));

    app.ipc.send('open-github-oauth-flow');
  },
  skip: function() {
    debug('skipping');
    this.parent.step++;
  },
  onSkipClicked: function(evt) {
    evt.preventDefault();
    this.skip();
  }
});
