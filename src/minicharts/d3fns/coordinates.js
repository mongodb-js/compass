var d3 = require('d3');
var _ = require('lodash');
var shared = require('./shared');
var GoogleMapsLoader = require('google-maps');

var minicharts_d3fns_coordinates = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;
  var options = {
    view: null
  };

  var margin = shared.margin;
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      var el = d3.select(this);
      var innerWidth = width - margin.left - margin.right;
      var innerHeight = height - margin.top - margin.bottom;

      var lons = data.filter(function(val, idx) {
        return idx % 2 === 0;
      });
      var lats = data.filter(function(val, idx) {
        return idx % 2 === 1;
      });

      var coords = _.zip(lons, lats);

      // Create the Google Map
      GoogleMapsLoader.KEY = 'AIzaSyAZ7WUH271VlhhkX0gf0iVa58anGCZUtL0';
      GoogleMapsLoader.load(function(google) {
        var map = new google.maps.Map(el.node(), {
          zoom: 8,
          center: new google.maps.LatLng(37.76487, -122.41948),
          mapTypeId: google.maps.MapTypeId.TERRAIN
        });
      });

      // append g element if it doesn't exist yet
      // div.enter()
      //   .append('g')
      //   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      //   .attr('width', innerWidth)
      //   .attr('height', innerHeight);

    });
  }

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  chart.options = function(value) {
    if (!arguments.length) {
      return options;
    }
    _.assign(options, value);
    return chart;
  };

  return chart;
};

module.exports = minicharts_d3fns_coordinates;
