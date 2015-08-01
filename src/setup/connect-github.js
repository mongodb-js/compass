var View = require('ampersand-view');
var app = require('ampersand-app');

module.exports = View.extend({
  events: {
    'click [data-hook=connect-github]': 'onGithubClicked',
    'click [data-hook=skip]': 'onSkipClicked'
  },
  template: require('./connect-github.jade'),
  onGithubClicked: function(evt) {
    evt.preventDefault();
    app.ipc.send('open-github-oauth-flow');
    app.ipc.once('github-oauth-flow-error', function(err) {
      console.error(err);
      this.parent.step++;
    }.bind(this));
    app.ipc.once('github-oauth-flow-complete', function(data) {
      app.user.set(data);
      app.user.save();
      this.parent.name = data.name;
      this.parent.email = data.email;
      this.parent.step++;
    }.bind(this));
  },
  onSkipClicked: function(evt) {
    evt.preventDefault();
    this.parent.step++;
  }
});
