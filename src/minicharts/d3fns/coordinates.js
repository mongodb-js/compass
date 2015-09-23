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

  var google = null;
  var googleMap = null;
  var overlay = null;
  var projection = null;

  var options = {
    view: null
  };

  var margin = shared.margin;

  function startSelection() {
    var frame = this;
    var center = d3.mouse(frame);
    var radius = 0;
    var padding = 2;

    var selectionSvg = d3.select('svg.selection');
    selectionSvg
      .style('left', center[0] - radius - padding + 'px')
      .style('top', center[1] - radius - padding + 'px')
      .style('width', 2 * (radius + padding))
      .style('height', 2 * (radius + padding))
      .style('visibility', 'visible');

    selectionSvg.select('circle')
      .attr('r', radius)
      .attr('cx', radius + padding)
      .attr('cy', radius + padding);

    debug('start selection', d3.mouse(frame));

    d3.select(window)
      .on('mousemove', function() {
        var m = d3.mouse(frame);
        var radius_sqr = Math.pow(m[0] - center[0], 2) + Math.pow(m[1] - center[1], 2);
        radius = Math.sqrt(radius_sqr);

        selectionSvg
          .style('left', center[0] - radius - padding + 'px')
          .style('top', center[1] - radius - padding + 'px')
          .style('width', 2 * (radius + padding))
          .style('height', 2 * (radius + padding));

        selectionSvg.select('circle')
          .attr('r', radius)
          .attr('cx', radius + padding)
          .attr('cy', radius + padding);

        d3.select(frame).selectAll('.marker circle')
          .classed('selected', function(d) {
            return Math.pow(d.x - center[0], 2) + Math.pow(d.y - center[1], 2) <= radius_sqr;
          });
      })
      .on('mouseup', function() {
        d3.select(window)
          .on('mouseup', null)
          .on('mousemove', null);

        if (radius === 0) {
          selectionSvg
            .style('visibility', 'hidden');
          d3.select(frame).selectAll('.marker circle')
            .classed('selected', false);
          return;
        }

        var m = d3.mouse(frame);
        var currentPoint = new google.maps.Point(m[0], m[1]);
        var centerPoint = new google.maps.Point(center[0], center[1]);
        var currentCoord = projection.fromContainerPixelToLatLng(currentPoint);
        var centerCoord = projection.fromContainerPixelToLatLng(centerPoint);
        var mileDistance = (google.maps.geometry.spherical.computeDistanceBetween(
          centerCoord, currentCoord) / 1600).toFixed(2);
      });
  }
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      if (!google) {
        // GoogleMapsLoader.KEY = 'AIzaSyDrhE1qbcnNIh4sK3t7GEcbLRdCNKWjlt0';
        GoogleMapsLoader.LIBRARIES = ['geometry'];
        GoogleMapsLoader.load(function(g) {
          google = g;
          chart.call(this, selection);
        });
        return;
      }

      var el = d3.select(this);
      var bounds = new google.maps.LatLngBounds();
      _.each(data, function(d) {
        var p = new google.maps.LatLng(d[1], d[0]);
        bounds.extend(p);
      });

      if (!googleMap) {
        el.on('mousedown', startSelection);

        // Create the Google Map
        googleMap = new google.maps.Map(el.node(), {
          disableDefaultUI: true,
          disableDoubleClickZoom: true,
          scrollwheel: true,
          draggable: false,
          panControl: false,
          mapTypeId: google.maps.MapTypeId.ROADMAP
          // styles: mapStyle
        });

        // Add the container when the overlay is added to the map.
        overlay = new google.maps.OverlayView();
        overlay.onAdd = function() {
          var layer = d3.select(this.getPanes().overlayMouseTarget).append('div')
            .attr('class', 'layer');

          // Draw each marker as a separate SVG element.
          // We could use a single SVG, but what size would it have?
          overlay.draw = function() {
            projection = this.getProjection();
            var padding = 9;

            var marker = layer.selectAll('svg.marker')
                .data(data)
                .each(transform) // update existing markers
              .enter().append('svg:svg')
                .each(transform)
                .attr('class', 'marker');

            // Add a circle
            marker.append('circle')
                .attr('r', 4.5)
                .attr('cx', padding)
                .attr('cy', padding);

            // add selection circle (hidden by default)
            var selectionSvg = layer.selectAll('svg.selection')
              .data([null])
              .enter().append('svg:svg')
                .attr('class', 'selection');

            selectionSvg.append('circle')
              .attr('r', 50)
              .attr('cx', 50)
              .attr('cy', 50);

            function transform(d) {
              var p = new google.maps.LatLng(d[1], d[0]);
              p = projection.fromLatLngToDivPixel(p);
              d.x = p.x;
              d.y = p.y;
              return d3.select(this)
                .style('left', p.x - padding + 'px')
                .style('top', p.y - padding + 'px');
            }
          }; // end overlay.draw
        }; // end overlay.onAdd
        overlay.setMap(googleMap);
      } // end if (!googleMap) ...

      // var innerWidth = width - margin.left - margin.right;
      // var innerHeight = height - margin.top - margin.bottom;

      googleMap.fitBounds(bounds);
    }); // end selection.each()
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
