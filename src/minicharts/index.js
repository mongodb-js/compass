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


// a wrapper around VizView to set common default values
module.exports = AmpersandView.extend({
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
  _toggleValue: function(data) {
    var value = data.d.label;
    if (this.model.getType() === 'Boolean') {
      value = value === 'true';
    }
    if (_.contains(this.selectedValues, value)) {
      _.remove(this.selectedValues, function(d) { return d === value; });
    } else {
      this.selectedValues.push(value);
    }
  },
  handleChartEvent: function(data) {
    data.evt.stopPropagation();
    data.evt.preventDefault();

    // handle visual feedback (.selected class on active elements)
    if (!data.evt.shiftKey || this.model.getType() === 'Number') {
      // special case for unselecting a single item on click
      if (this.selectedValues.length > 1 || data.d.label !== this.selectedValues[0]) {
        // remove `.selected` class from all other elements
        _.each(data.all, function(e) {
          e.classList.remove('selected');
        });
        this.selectedValues = [];
      }
    }
    data.self.classList.toggle('selected');
    switch (this.model.getType()) {
      case 'Boolean': // fall-through to String
      case 'String':
        this._toggleValue(data);
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
        break;
      case 'Number':
        this._extendRange(data);
        break;
      default: // @todo other types not implemented yet
        break;
    }

    // derive new refineValue from selectedValues

    // derive new refineValue from event
    // if (selfSelected) {
    //   if (data.evt.shiftKey) {
    //   } else {
    //     this.unset('refineValue'); // back to default empty, invalid Value()
    //   }
    // } else {
    //   switch (this.model.getType()) {
    //     case 'Boolean': // fall-through to String
    //     case 'String':
    //       if (data.evt.shiftKey) {
    //         if (this.refineValue.className === 'LeafValue') {
    //           // convert LeafValue to $in ListOperator
    //           this.refineValue = new ListOperator({
    //             $in: [this.refineValue.serialize(), data.d.label]
    //           }, { parse: true });
    //         } else if (this.refineValue.className === 'ListOperator') {
    //           // already ListOperator, simply add value
    //           this.refineValue.values.add(data.d.label);
    //           this.trigger('change:refineValue');
    //         } else {
    //           throw new Error('unexpected refineValue type');
    //         }
    //       } else {
    //         // set single LeafValue
    //         this.refineValue = new LeafValue(data.d.label, {
    //           parse: true
    //         });
    //       }
    //       break;
    //     case 'Number':
    //       if (data.type === 'click') {
    //         this.refineValue = data.source === 'unique' ?
    //           new LeafValue(parseInt(data.d.label, 10), {
    //             parse: true
    //           }) : new Range(data.d.x, data.d.x + data.d.dx);
    //       }
    //       break;
    //     default:
    //       // @todo other types not implemented yet
    //       break;
    //   }
    // }
  }
});
