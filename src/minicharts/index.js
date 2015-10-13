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
  _mangleGeoCoordinates: function(values) {
    debug('mangle values', values)
    // now check value bounds
    var lons = values.filter(function(val, idx) {
      return idx % 2 === 0;
    });
    var lats = values.filter(function(val, idx) {
      return idx % 2 === 1;
    });
    if (_.min(lons) >= -180 && _.max(lons) <= 180 && _.min(lats) >= -90 && _.max(lats) <= 90) {

      // attach the zipped up coordinates to the model where VizView would expect it
      return new ArrayCollection(_.zip(lons, lats));
    }
    return false;
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
      // are these coordinates? Do a basic check for now, until we support semantic schema types
      // here we check for GeoJSON form: { loc: {type: "Point", "coordinates": [47.80, 9.63] } }
      var isGeo = false;
      if (app.isFeatureEnabled('Geo Minicharts')) {
        if (this.model.fields.length === 2
          && this.model.fields.get('type')
          && this.model.fields.get('type').type === 'String'
          && this.model.fields.get('type').types.get('String').unique === 1
          && this.model.fields.get('type').types.get('String').values.at(0).value === 'Point'
          && this.model.fields.get('coordinates').types.get('Array').count
             === this.model.fields.get('coordinates').count
          && this.model.fields.get('coordinates').types.get('Array').average_length === 2
        ) {
          var coords =this._mangleGeoCoordinates(
            this.model.fields.get('coordinates').types.get('Array')
            .types.get('Number').values.serialize());
          if (coords) {
            this.model.values = coords;
            this.model.fields.reset();
            isGeo = true;
          }
        }
      }
      if (isGeo) {
        // coordinates get an HTML-based d3 VizView with `coordinates` vizFn
        this.viewOptions.renderMode = 'html';
        this.viewOptions.height = 250;
        this.viewOptions.vizFn = vizFns.geo;
        this.subview = new VizView(this.viewOptions);
      } else {
        // nested objects get a div-based DocumentRootMinichart
        this.viewOptions.height = 55;
        this.subview = new DocumentRootMinichartView(this.viewOptions);
      }
    } else if (this.model.name === 'Array') {
      var isGeo = false;
      if (app.isFeatureEnabled('Geo Minicharts')) {
        // are these coordinates? Do a basic check for now, until we support semantic schema types
        // here we check for legacy coordinates in array form: { loc: [47.80, 9.63] }
        var lengths = this.model.lengths;
        if (_.min(lengths) === 2 && _.max(lengths) === 2) {
          var coords = this._mangleGeoCoordinates(
            this.model.types.get('Number').values.serialize());
          if (coords) {
            this.model.values = coords;
            isGeo = true;
          }
        }
      }
      if (isGeo) {
        // coordinates get an HTML-based d3 VizView with `coordinates` vizFn
        this.viewOptions.renderMode = 'html';
        this.viewOptions.height = 250;
        this.viewOptions.vizFn = vizFns.geo;
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
    if (app.isFeatureEnabled('querybuilder')) {
      this.listenTo(this.subview, 'querybuilder', this.handleQueryBuilderEvent);
    }
    raf(function() {
      this.renderSubview(this.subview, this.queryByHook('minichart'));
    }.bind(this));
  }
});
