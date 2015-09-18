var d3 = require('d3');
var _ = require('lodash');
var shared = require('./shared');
var debug = require('debug')('scout:minicharts:coordinates');
var GoogleMapsLoader = require('google-maps');
var mapStyle = require('./mapstyle');

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
      // var innerWidth = width - margin.left - margin.right;
      // var innerHeight = height - margin.top - margin.bottom;

      // set up the bounds
      GoogleMapsLoader.load(function(google) {
        // compute map bounds from all coordinates
        var bounds = new google.maps.LatLngBounds();
        _.each(data, function(coord) {
          var p = new google.maps.LatLng(coord[1], coord[0]);
          bounds.extend(p);
        });

        // Create the Google Map
        var map = new google.maps.Map(el.node(), {
          disableDefaultUI: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: mapStyle
        });
        map.fitBounds(bounds);

        var overlay = new google.maps.OverlayView();

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function() {
          var layer = d3.select(this.getPanes().overlayLayer).append('div')
            .attr('class', 'coords');

          // Draw each marker as a separate SVG element.
          // We could use a single SVG, but what size would it have?
          overlay.draw = function() {
            var projection = this.getProjection();
            var padding = 10;

            var marker = layer.selectAll('svg')
                .data(data)
                .each(transform) // update existing markers
              .enter().append('svg:svg')
                .each(transform)
                .attr('class', 'marker');

            // Add a circle.
            marker.append('circle')
                .attr('r', 4.5)
                .attr('cx', padding)
                .attr('cy', padding);

            // Add a label.
            // marker.append('svg:text')
            //     .attr('x', padding + 7)
            //     .attr('y', padding)
            //     .attr('dy', '.31em')
            //     .text(function(d) { return d; });

            function transform(d) {
              d = new google.maps.LatLng(d[1], d[0]);
              d = projection.fromLatLngToDivPixel(d);
              var s = d3.select(this)
                  .style('left', d.x - padding + 'px')
                  .style('top', d.y - padding + 'px');
              debug('s', s);
              return s;
            }
          };
        };

        // append g element if it doesn't exist yet
        // div.enter()
        //   .append('g')
        //   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        //   .attr('width', innerWidth)
        //   .attr('height', innerHeight);

        // Bind our overlay to the map…
        overlay.setMap(map);
      });
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
