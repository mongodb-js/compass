var View = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var onAnimationEnd = require('animationend');
var app = require('ampersand-app');
var debug = require('debug')('scout:setup');

var stepKlasses = [
  require('./welcome'),
  // require('./connect-github'),
  require('./user-info'),
  // require('./connect-mongodb'),
  require('./finished')
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
    }
  },
  goToStep: function(n) {
    debug('going to step %d', n);
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
        oldView.el.classList.add('bounceOutLeft');
      },
      show: function(newView) {
        newView.el.classList.add('bounceInRight');
      }
    });
    this.goToStep(this.step);
    document.title = 'Welcome to MongoDB Scout';
  },
  complete: function() {
    app.ipc.send('mark-setup-complete');
    app.ipc.send('open-connect-dialog');
    setTimeout(window.close, 500);
  }
});
module.exports = FirstRunView;
