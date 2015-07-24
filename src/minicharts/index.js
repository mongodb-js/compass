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
      required: true,
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
    this.listenTo(this.subview, 'chart', this.handleChartEvent);
    raf(function() {
      this.renderSubview(this.subview, this.queryByHook('minichart'));
    }.bind(this));
  },
  handleChartEvent: function(data) {
    data.evt.stopPropagation();
    data.evt.preventDefault();

    // handle visual feedback (.selected class on active elements)
    var selfSelected = data.self.classList.contains('selected');
    if (!data.evt.shiftKey || this.model.getType() === 'Number') {
      // remove `.selected` class from all elements
      _.each(data.all, function(e) {
        e.classList.remove('selected');
      });
    }
    data.self.classList.toggle('selected', !selfSelected);

    // derive new refine value from event
    if (selfSelected) {
      this.unset('refineValue'); // back to default empty, invalid Value()
    } else {
      switch (this.model.getType()) {
        case 'Boolean': // fall-through to String
        case 'String':
          if (data.type === 'click') {
            this.refineValue = new LeafValue(data.d.label, {
              parse: true
            });
          }
          break;
        case 'Number':
          if (data.type === 'click') {
            this.refineValue = data.source === 'unique' ?
              new LeafValue(parseInt(data.d.label, 10), {
                parse: true
              }) : new Range(data.d.x, data.d.x + data.d.dx);
          }
          break;
        default:
          // @todo other types not implemented yet
          break;
      }
    }
  }
});
