var AmpersandRouter = require('ampersand-router');
var intercom = require('./intercom');
var HomePage = require('./home');
var Connect = require('./connect');
var Setup = require('./setup');
var app = require('ampersand-app');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    schema: 'index',
    connect: 'connect',
    'setup': 'setup',
    'setup/:step': 'setup',
    'schema/:ns': 'schema',
    '(*path)': 'catchAll',
  },
  index: function() {
    intercom.track('Connected to MongoDB');
    this.trigger('page', new HomePage({}));
  },
  schema: function(ns) {
    app.intercom.show();
    this.trigger('page', new HomePage({
      ns: ns
    }));
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    app.intercom.hide();
    intercom.track('Open Connect Dialog');
    this.trigger('page', new Connect({}));
  },
  setup: function(step) {
    app.intercom.hide();
    intercom.track('Open Setup');
    this.trigger('page', new Setup({
      step: parseInt(step || 1, 10)
    }));
  }
});
