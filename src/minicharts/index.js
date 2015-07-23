var VizView = require('./viz');
var AmpersandView = require('ampersand-view');
var UniqueMinichartView = require('./unique');
var vizFns = require('./d3fns');
var _ = require('lodash');
var raf = require('raf');
var debug = require('debug')('scout:minicharts:index');

var Value = require('mongodb-language-model').Value;
var LeafValue = require('mongodb-language-model').LeafValue;
var Range = require('mongodb-language-model').helpers.Range;


// a wrapper around VizView to set common default values
module.exports = AmpersandView.extend({
  template: require('./minichart.jade'),
  session: {
    subview: 'view',
    viewOptions: 'object',
    refineValue: {
      type: 'state',
      default: function() {
        return new Value();
      }
    }
  },
  initialize: function(opts) {
    // setting some defaults for minicharts
    this.viewOptions = _.defaults(opts, {
      width: 440,
      height: 100,
      renderMode: 'svg',
      className: 'minichart',
      debounceRender: false,
      vizFn: vizFns[opts.model.getId().toLowerCase()] || null
    });
  },
  render: function() {
    this.renderWithTemplate(this);
    // unique values get a div-based minichart
    if (['String', 'Number'].indexOf(this.model.name) !== -1
      && this.model.unique === this.model.count) {
      this.viewOptions.renderMode = 'html';
      this.viewOptions.vizFn = null;
      this.viewOptions.className = 'minichart unique';
      this.subview = new UniqueMinichartView(this.viewOptions);
    } else {
      this.subview = new VizView(this.viewOptions);
    }
    // attach event handler based on model type, if available
    var evtHandlerName = 'handleChartEvent' + this.model.getType();
    if (this[evtHandlerName]) {
      this.listenTo(this.subview, 'chart', this[evtHandlerName]);
    }
    raf(function() {
      this.renderSubview(this.subview, this.queryByHook('minichart'));
    }.bind(this));
  },
  handleChartEventString: function(evt) {
    if (evt.type === 'click') {
      this.refineValue = new LeafValue(evt.d.label, {
        parse: true
      });
    }
  },
  handleChartEventNumber: function(evt) {
    if (evt.type === 'click') {
      this.refineValue = evt.source === 'unique' ?
        new LeafValue(parseInt(evt.d.label, 10), {
          parse: true
        }) :
        new Range(evt.d.x, evt.d.x + evt.d.dx);
    }
  },
  handleChartEventDate: function() {
    // @todo not implemented yet
  },
  handleChartEventBoolean: function(evt) {
    // same as string
    this.handleEventChartString(evt);
  }
});
