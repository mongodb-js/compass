var AmpersandView = require('ampersand-view');
var _ = require('lodash');
var raf = require('raf');
var app = require('ampersand-app');
var VizView = require('./viz');
var UniqueMinichartView = require('./unique');
var DocumentRootMinichartView = require('./document-root');
var ArrayRootMinichartView = require('./array-root');
var vizFns = require('./d3fns');
var QueryBuilderMixin = require('./querybuilder');
// var debug = require('debug')('scout:minicharts:index');


/**
 * a wrapper around VizView to set common default values
 */
module.exports = AmpersandView.extend(QueryBuilderMixin, {
  modelType: 'MinichartView',
  template: require('./minichart.jade'),
  session: {
    subview: 'view',
    viewOptions: 'object',
    selectedValues: {
      type: 'array',
      default: function() {
        return [];
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
    this.listenTo(app.volatileQueryOptions, 'change:query', this.handleVolatileQueryChange);
  },
  render: function() {
    this.renderWithTemplate(this);

    if (['String', 'Number'].indexOf(this.model.name) !== -1
      && this.model.unique === this.model.count) {
      // unique values get a div-based UniqueMinichart
      this.viewOptions.renderMode = 'html';
      this.viewOptions.vizFn = null;
      this.viewOptions.className = 'minichart unique';
      this.subview = new UniqueMinichartView(this.viewOptions);
    } else if (this.model.name === 'Document') {
      // nested objects get a div-based DocumentRootMinichart
      this.viewOptions.height = 55;
      this.subview = new DocumentRootMinichartView(this.viewOptions);
    } else if (this.model.name === 'Array') {
      // arrays get a div-based ArrayRootMinichart
      this.subview = new ArrayRootMinichartView(this.viewOptions);
    } else {
      // otherwise, create a svg-based VizView for d3
      this.subview = new VizView(this.viewOptions);
    }
    if (app.features.querybuilder) {
      this.listenTo(this.subview, 'querybuilder', this.handleQueryBuilderEvent);
    }
    raf(function() {
      this.renderSubview(this.subview, this.queryByHook('minichart'));
    }.bind(this));
  }
});
