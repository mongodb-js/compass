var VizView = require('./viz');
var AmpersandView = require('ampersand-view');
var UniqueMinichartView = require('./unique');
var vizFns = require('./d3fns');
var _ = require('lodash');
var raf = require('raf');
var debug = require('debug')('scout:minicharts:index');

var Value = require('mongodb-language-model').Value;
var LeafValue = require('mongodb-language-model').LeafValue;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;

var MODIFIERKEY = 'shiftKey';

// a wrapper around VizView to set common default values
module.exports = AmpersandView.extend({
  modelType: 'MinichartView',
  template: require('./minichart.jade'),
  session: {
    subview: 'view',
    viewOptions: 'object',
    refineValue: {
      type: 'state',
      required: true,
      default: function() {
        return new Value();
      }
    },
    selectedValues: {
      type: 'array',
      default: function() { return []; }
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
    this.listenTo(this.subview, 'chart', this.handleChartEvent);
    raf(function() {
      this.renderSubview(this.subview, this.queryByHook('minichart'));
    }.bind(this));
  },
  handleDistinct: function(data) {
    // extract value
    var value = data.d.label;
    if (this.model.getType() === 'Boolean') {
      value = value === 'true';
    } else if (this.model.getType() === 'Number') {
      value = parseFloat(value, 10);
    }

    // handle visual feedback (.selected class on active elements)
    if (!data.evt[MODIFIERKEY]) {
      // special case for unselecting a single item on click
      if (this.selectedValues.length > 1 || value !== this.selectedValues[0]) {
        // remove `.selected` class from all elements
        _.each(data.all, function(el) {
          el.classList.remove('selected');
        });
        this.selectedValues = [];
      }
    }
    data.self.classList.toggle('selected');

    // build new refineValue
    if (_.contains(this.selectedValues, value)) {
      _.remove(this.selectedValues, function(d) { return d === value; });
    } else {
      this.selectedValues.push(value);
    }
    if (this.selectedValues.length === 0) {
      // no value
      this.unset('refineValue');
    } else if (this.selectedValues.length === 1) {
      // single value
      this.refineValue = new LeafValue(this.selectedValues[0], {
        parse: true
      });
    } else {
      // multiple values
      this.refineValue = new ListOperator({
        $in: this.selectedValues
      }, { parse: true });
    }
  },
  handleNumeric: function(data) {
    if (data.evt[MODIFIERKEY]) {
      this.selectedValues[1] = data;
    } else if (this.selectedValues[0] && this.selectedValues[0].i === data.i) {
      this.selectedValues = [];
    } else {
      this.selectedValues = [data];
    }
    // remove `.selected` class from all elements
    _.each(data.all, function(el) {
      el.classList.remove('selected');
    });
    if (!this.selectedValues[0]) {
      // no value
      this.unset('refineValue');
    } else {
      var first = _.min(this.selectedValues, function(d) { return d.d.x; });
      var last = _.max(this.selectedValues, function(d) { return d.d.x; });

      var lower = first.d.x;
      var upper = last.d.x + last.d.dx;
      this.refineValue = new Range(lower, upper);
      _.each(data.all.slice(first.i, last.i + 1), function(el) {
        el.classList.add('selected');
      });
    }
  },
  handleChartEvent: function(data) {
    data.evt.stopPropagation();
    data.evt.preventDefault();

    switch (this.model.getType()) {
      case 'Boolean': // fall-through to String
      case 'String':
        this.handleDistinct(data);
        break;
      case 'Number':
        if (data.source === 'unique') {
          this.handleDistinct(data);
        } else {
          this.handleNumeric(data);
        }
        break;
      default: // @todo other types not implemented yet
        break;
    }
  }
});
