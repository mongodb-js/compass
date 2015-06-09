var AmpersandView = require('ampersand-view');
var Schema = require('mongodb-schema').Schema;
var es = require('event-stream');
var MinichartView = require('../minicharts');
var _ = require('lodash');
var debug = require('debug')('scout-ui:playground:minicharts');
var EJSON = require('mongodb-extended-json');

require('bootstrap/js/tab');

module.exports = AmpersandView.extend({
  template: require('./minicharts.jade'),
  props: {
    fanclubFieldMap: {
      type: 'object',
      default: function() {
        return {
          'Date': 'last_login',
          'Number': 'age',
          'Many': 'favorite_feature',
          'Few': 'membership_status',
          'Unique': 'name'
        };
      }
    }
  },
  derived: {
    tabs: {
      deps: ['fanclubFieldMap'],
      fn: function() {
        return _.keys(this.fanclubFieldMap).map(function(k) {
          return k.toLowerCase();
        });
      }
    },
    capitalTabs: {
      deps: ['fanclubFieldMap'],
      fn: function() {
        return _.keys(this.fanclubFieldMap).map(function(k) {
          return _.capitalize(k);
        });
      }
    }

  },
  initialize: function() {
    this.model = new Schema({
      ns: 'mongodb.fanclub'
    });
    var docs = require('../fixtures/mongodb.fanclub.json')
      .map(function(d) {
        return EJSON.parse(JSON.stringify(d));
      });

    debug('docs', docs);

    es.readArray(docs)
      .pipe(this.model.stream())
      .on('end', this.schemaReady.bind(this));
  },
  schemaReady: function() {
    var that = this;

    var charts = _.map(this.fanclubFieldMap, function(v, k) {
      return {
        model: that.model.fields.get(v).types.at(0),
        type: k.toLowerCase(),
        field: v
      };
    });

    _.each(charts, function(chart) {
      var view = new MinichartView({
        model: chart.model
      });
      that.renderSubview(view, that.queryByHook(chart.type + '-minichart'));
    });
  }
});
