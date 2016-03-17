var View = require('ampersand-view');
var ms = require('ms');
var app = require('ampersand-app');
var jade = require('jade');
var path = require('path');

// var debug = require('debug')('mongodb-compass:statusbar:schema-subview');
var subviewTemplate = jade.compileFile(path.resolve(__dirname, 'schema-subview.jade'));


var SHOW_STEPS_MS = 3000;
var SHOW_ANALYZING_BUTTONS_MS = app.queryOptions.maxTimeMS + 1000;

module.exports = View.extend({
  template: subviewTemplate,
  props: {
    schema: {
      type: 'state',
      default: null
    },
    timer: {
      type: 'any',
      default: null
    },
    activeStep: {
      type: 'string',
      values: ['sampling', 'analyzing'],
      default: 'sampling'
    },
    error: {
      type: 'boolean',
      default: false
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
    nextActionLabel: {
      deps: ['activeStep'],
      fn: function() {
        return this.activeStep === 'sampling' ?
          'Create new Query' : 'Show partial results';
      }
    },
    samplingState: {
      deps: ['activeStep', 'error'],
      fn: function() {
        if (this.activeStep === 'sampling') {
          return this.error ? 'error' : 'active';
        }
        return 'complete';
      }
    },
    analyzingState: {
      deps: ['activeStep', 'error'],
      fn: function() {
        if (this.activeStep === 'analyzing') {
          return this.error ? 'error' : 'active';
        }
        return 'waiting';
      }
    },
    maxTimeMSStr: {
      deps: ['app.queryOptions.maxTimeMS'],
      fn: function() {
        return ms(app.queryOptions.maxTimeMS, {long: true});
      }
    }
  },
  bindings: {
    nextActionLabel: {
      hook: 'next-action-button',
      type: 'text'
    },
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
    error: {
      type: 'toggle',
      no: '#buttons-waiting',
      yes: '#buttons-error'
    },
    activeStep: [
      // {
      //   type: 'switch',
      //   hook: 'buttons',
      //   cases: {
      //     sampling: '#buttons-sampling',
      //     analyzing: '#buttons-analyzing'
      //   }
      // },
      {
        type: 'switchClass',
        name: 'is-active',
        cases: {
          sampling: '#sampling-step',
          analyzing: '#analyzing-step'
        }
      }
    ],
    maxTimeMSStr: {
      hook: 'maxtimems'
    },
    samplingState: {
      hook: 'sampling-indicator',
      type: function(el, value) {
        switch (value) {
          case 'active': el.className = 'fa fa-fw fa-spin fa-circle-o-notch'; break;
          case 'complete': el.className = 'mms-icon-check'; break;
          case 'error': el.className = 'fa fa-fw fa-warning'; break;
          default: el.className = 'fa fa-fw';
        }
      }
    },
    analyzingState: {
      hook: 'analyzing-indicator',
      type: function(el, value) {
        switch (value) {
          case 'active': el.className = 'fa fa-fw fa-spin fa-circle-o-notch'; break;
          case 'complete': el.className = 'mms-icon-check'; break;
          case 'error': el.className = 'fa fa-fw fa-warning'; break;
          default: el.className = 'fa fa-fw';
        }
      }
    }
  },
  events: {
    'click [data-hook=stop-analyzing-button]': 'stopAnalyzingClicked',
    'click [data-hook=partial-results-button]': 'stopAnalyzingClicked',
    'click [data-hook=next-action-button]': 'nextActionClicked',
    'click [data-hook=increase-maxtimems-button]': 'resampleWithLongerTimoutClicked'
  },
  render: function() {
    this.renderWithTemplate(this);
    this.on('change:activeStep', this.analyzingBegun.bind(this));
    this.timer = setTimeout(this.showSteps.bind(this), SHOW_STEPS_MS);
  },
  analyzingBegun: function() {
    setTimeout(this.showButtons.bind(this), SHOW_ANALYZING_BUTTONS_MS);
  },
  showSteps: function() {
    clearTimeout(this.timer);
    this.stepsVisible = true;
  },
  showButtons: function() {
    this.stepsVisible = true;
    this.buttonsVisible = true;
  },
  stopAnalyzingClicked: function() {
    if (this.schema) {
      this.schema.stopAnalyzing();
    }
  },
  resampleWithLongerTimoutClicked: function() {
    this.schema.reSampleWithLongerTimeout();
  },
  nextActionClicked: function() {
    if (this.schema && this.schema.count > 0) {
      return this.schema.stopAnalyzing();
    }
    app.statusbar.hide();
  },
  remove: function() {
    clearTimeout(this.timer);
    this.stepsVisible = false;
    this.buttonsVisible = false;
    View.prototype.remove.call(this);
  }
});
