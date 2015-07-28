var VizView = require('./viz');
var AmpersandView = require('ampersand-view');
var UniqueMinichartView = require('./unique');
var vizFns = require('./d3fns');
var _ = require('lodash');
var raf = require('raf');
var app = require('ampersand-app');
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
    if (app.features.querybuilder) {
      this.listenTo(this.subview, 'chart', this.handleChartEvent);
    }
    raf(function() {
      this.renderSubview(this.subview, this.queryByHook('minichart'));
    }.bind(this));
  },
  extractDistinctValue: function(data) {
    // extract value
    var value = data.d.label;
    if (this.model.getType() === 'Boolean') {
      value = value === 'true';
    } else if (this.model.getType() === 'Number') {
      value = parseFloat(value, 10);
    }
    return value;
  },
  handleDistinct: function(data) {
    // update selectedValues
    if (!data.evt[MODIFIERKEY]) {
      if (this.selectedValues.length === 1 && this.selectedValues[0].self === data.self) {
        this.selectedValues = [];
      } else {
        this.selectedValues = [data];
      }
    } else if (_.contains(_.pluck(this.selectedValues, 'i'), data.i)) {
      _.remove(this.selectedValues, function(d) { return d.i === data.i; });
    } else {
      this.selectedValues.push(data);
    }

    // visual updates
    _.each(data.all, function(el) {
      el.classList.remove('selected');
      if (this.selectedValues.length === 0) {
        // remove all styling
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    }.bind(this));
    _.each(this.selectedValues, function(selected) {
      selected.self.classList.add('selected');
      selected.self.classList.remove('unselected');
    });

    // build new refineValue
    if (this.selectedValues.length === 0) {
      // no value
      this.unset('refineValue');
    } else if (this.selectedValues.length === 1) {
      // single value
      this.refineValue = new LeafValue(this.extractDistinctValue(this.selectedValues[0]), {
        parse: true
      });
    } else {
      // multiple values
      this.refineValue = new ListOperator({
        $in: this.selectedValues.map(this.extractDistinctValue.bind(this))
      }, { parse: true });
    }
  },
  handleRange: function(data) {
    if (data.evt[MODIFIERKEY]) {
      this.selectedValues[1] = data;
    } else if (this.selectedValues[0] && this.selectedValues[0].i === data.i) {
      this.selectedValues = [];
    } else {
      this.selectedValues = [data];
    }
    var firstSelected = this.selectedValues[0];
    // remove `.selected` class from all elements
    _.each(data.all, function(el) {
      el.classList.remove('selected');
      if (!firstSelected) {
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    });
    if (!firstSelected) {
      // no value
      this.unset('refineValue');
    } else {
      var first, last, lower, upper;
      if (this.model.getType() === 'Number') {
        first = _.min(this.selectedValues, function(el) { return el.d.x; });
        last = _.max(this.selectedValues, function(el) { return el.d.x; });
        lower = first.d.x;
        upper = last.d.x + last.d.dx;
        _.each(data.all.slice(first.i, last.i + 1), function(el) {
          el.classList.add('selected');
          el.classList.remove('unselected');
        });
        this.refineValue = new Range(lower, upper);
      } else if (this.model.getType() === 'Date') {
        first = _.min(this.selectedValues, function(el) { return el.d.getTime(); });
        last = _.max(this.selectedValues, function(el) { return el.d.getTime(); });
        lower = first.d;
        upper = last.d;
        _(data.all)
          .filter(function(el) {
            return el.d >= upper && el.d < lower;
          })
          .each(function(el) {
            el.self.classList.add('selected');
            el.self.classList.remove('unselected');
          });
        if (lower === upper) {
          this.refineValue = new LeafValue({ content: lower });
        } else {
          this.refineValue = new Range(lower, upper);
        }
      }
      debug('lower', lower, 'upper', upper);
    }
  },
  handleChartEvent: function(data) {
    debug('data', this.model.getType());

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
          this.handleRange(data);
        }
        break;
      case 'ObjectID': // fall-through to Date
      case 'Date':
        this.handleRange(data);
        break;
      default: // @todo other types not implemented yet
        break;
    }
  }
});
