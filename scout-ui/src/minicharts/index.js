var VizView = require('./viz');
var vizFns = require('./d3fns');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts');

// a wrapper around VizView to set common default values
module.exports = VizView.extend({
  constructor: function (opts) {

    // setting some defaults for minicharts
    opts = _.defaults(opts, {
      width: 400,
      height: 100,
      renderMode: 'svg',
      className: 'minichart',
      debounceRender: false,
      vizFn: vizFns[opts.model._id.toLowerCase()]
    });

    VizView.prototype.constructor.call(this, opts);
  }
});
