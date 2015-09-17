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
var debug = require('debug')('scout:minicharts:index');
var Collection = require('ampersand-collection');

var ArrayCollection = Collection.extend({
  model: Array
});

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
      var isCoordinates = false;

      // are these coordinates? Do a basic check for now, until we support semantic schema types
      var lengths = this.model.lengths;
      var coords;
      if (_.min(lengths) === 2 && _.max(lengths) === 2) {
        // now check value bounds
        var values = this.model.types.get('Number').values.serialize();
        var lons = values.filter(function(val, idx) {
          return idx % 2 === 0;
        });
        var lats = values.filter(function(val, idx) {
          return idx % 2 === 1;
        });
        if (_.min(lons) >= -180 && _.max(lons) <= 180 && _.min(lats) >= -90 && _.max(lats) <= 90) {
          isCoordinates = true;
          // attach the zipped up coordinates to the model where VizView would expect it
          this.model.values = new ArrayCollection(_.zip(lons, lats));
          debug('model.values', this.model.values);
        }
      }
      if (isCoordinates) {
        // coordinates get an HTML-based d3 VizView with `coordinates` vizFn
        this.viewOptions.renderMode = 'html';
        this.viewOptions.vizFn = vizFns.coordinates;
        this.subview = new VizView(this.viewOptions);
      } else {
        // plain arrays get a div-based ArrayRootMinichart
        this.viewOptions.height = 55;
        this.subview = new ArrayRootMinichartView(this.viewOptions);
      }
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
