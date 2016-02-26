var View = require('ampersand-view');

// var debug = require('debug')('mongodb-compass:statusbar:schema-subview');

var SHOW_STEPS_MS = 3000;
var SHOW_BUTTONS_MS = 7000;

module.exports = View.extend({
  template: require('./schema-subview.jade'),
  props: {
    timer: {
      type: 'any',
      default: null
    },
    activeStep: {
      type: 'string',
      values: ['sampling', 'analyzing'],
      default: 'sampling'
    },
    stepsVisible: {
      type: 'boolean',
      default: false
    },
    buttonsVisible: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    analyzingBegun: {
      deps: ['activeStep'],
      fn: function() {
        return this.activeStep === 'analyzing';
      }
    }
  },
  bindings: {
    stepsVisible: {
      type: 'toggle',
      hook: 'steps',
      mode: 'visibility'
    },
    buttonsVisible: {
      type: 'toggle',
      hook: 'buttons',
      mode: 'visibility'
    },
    activeStep: {
      type: 'switch',
      hook: 'buttons',
      cases: {
        sampling: '#buttons-sampling',
        analyzing: '#buttons-analyzing'
      }

    },
    analyzingBegun: [
      {
        type: 'booleanClass',
        hook: 'sampling',
        name: 'complete'
      },
      {
        type: 'booleanClass',
        hook: 'analyzing',
        name: 'active'
      }
    ]
  },
  render: function() {
    this.renderWithTemplate(this);
    this.timer = setTimeout(this.showSteps.bind(this), SHOW_STEPS_MS);
  },
  showSteps: function() {
    this.timer = setTimeout(this.showButtons.bind(this), SHOW_BUTTONS_MS);
    this.stepsVisible = true;
  },
  showButtons: function() {
    this.buttonsVisible = true;
  },
  remove: function() {
    clearTimeout(this.timer);
    this.stepsVisible = false;
    this.buttonsVisible = false;
    View.prototype.remove.call(this);
  }
});
