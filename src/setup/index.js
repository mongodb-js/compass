var View = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var onAnimationEnd = require('animationend');
var app = require('ampersand-app');
var debug = require('debug')('scout:setup');
var format = require('util').format;

var Connection = require('../models/connection');

var stepKlasses = [
  require('./welcome'),
  require('./user-info'),
  require('./connect-mongodb')
];

var FirstRunView = View.extend({
  props: {
    step: {
      type: 'number',
      default: 1
    },
    name: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    hostname: {
      type: 'string',
      default: 'localhost'
    },
    port: {
      type: 'number',
      default: 27017
    },
    connection_name: {
      type: 'string',
      default: 'Dev Database'
    }

  },
  goToStep: function(n) {
    debug('going to step %d', n);
    var isLast = n === this.steps.length - 1;
    if (isLast) {
      return this.complete();
    }
    this.switcher.set(this.steps[n - 1]);
    app.navigate('setup/' + n, {
      silent: true
    });
  },
  initialize: function() {
    this.listenTo(this, 'change:step', function(view, newVal) {
      this.goToStep(newVal);
    });

    this.steps = stepKlasses.map(function(Klass) {
      return new Klass({
        parent: this
      });
    }.bind(this));
  },
  template: require('./index.jade'),
  render: function() {
    this.renderWithTemplate();
    this.stepContainer = this.queryByHook('step-container');
    this.switcher = new ViewSwitcher(this.stepContainer, {
      waitForRemove: true,
      hide: function(oldView, cb) {
        onAnimationEnd(oldView.el, function() {
          setTimeout(cb, 200);
        });
        oldView.el.classList.add('fadeOut');
      },
      show: function(newView) {
        newView.el.classList.add('fadeIn');
      }
    });
    this.goToStep(this.step);
    document.title = 'Welcome to MongoDB Scout';
  },
  complete: function() {
    debug('Setup complete!');
    var model = new Connection({
      name: this.connection_name,
      hostname: this.hostname,
      port: this.port
    });
    model.save();
    window.open(format('%s?uri=%s#schema', window.location.origin, model.uri));

    app.ipc.send('mark-setup-complete');
    setTimeout(window.close, 500);
  }
});
module.exports = FirstRunView;
