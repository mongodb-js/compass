var VizView = require('./viz');
var AmpersandView = require('ampersand-view');
var UniqueMinichartView = require('./unique');
var vizFns = require('./d3fns');
var _ = require('lodash');

// a wrapper around VizView to set common default values
module.exports = AmpersandView.extend({
  template: require('./minichart.jade'),
  props: {
    subview: 'view',
    viewOptions: 'object'
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
    var model = this.model;
    if (model.getId() === 'String' && model.unique === model.count) {
      this.viewOptions.renderMode = 'html';
      this.viewOptions.className = 'minichart unique';
      this.subview = new UniqueMinichartView(this.viewOptions);
    } else {
      this.subview = new VizView(this.viewOptions);
    }

    this.renderSubview(this.subview, this.queryByHook('minichart'));
  }
});
