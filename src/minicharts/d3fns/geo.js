var d3 = require('d3');
var _ = require('lodash');
var shared = require('./shared');
// var debug = require('debug')('scout:minicharts:geo');
var GoogleMapsLoader = require('google-maps');
var mapStyle = require('./mapstyle');
var SHIFTKEY = 16;

var Singleton = (function() {
  var instance;

  function createInstance() {
    var object = {};
    return object;
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

var singleton = Singleton.getInstance();

var minicharts_d3fns_geo = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;

  var googleMap = null;
  var overlay = null;
  var projection = null;
  var selectionCircle;
  var currentCoord;

  var options = {
    view: null
  };

  var margin = shared.margin;

  function pointInCircle(point, radius, center) {
    return singleton.google.maps.geometry.spherical.computeDistanceBetween(point, center) <= radius;
  }

  function selectPoints() {
    var frame = options.el;
    var google = singleton.google;

    if (selectionCircle.getRadius() === 0) {
      d3.select(frame).selectAll('.marker circle')
        .classed('selected', false);
      return;
    }

    d3.select(frame).selectAll('.marker circle')
      .classed('selected', function(d) {
        var p = new google.maps.LatLng(d[1], d[0]);
        return pointInCircle(p, selectionCircle.getRadius(), selectionCircle.getCenter());
      });
  }

  function onKeyDown() {
    if (d3.event.keyCode === SHIFTKEY) {
      // disable dragging while shift is pressed
      googleMap.setOptions({ draggable: false });
    }
  }

  function onKeyUp() {
    if (d3.event.keyCode === SHIFTKEY) {
      // disable dragging while shift is pressed
      googleMap.setOptions({ draggable: true });
    }
  }

  function startSelection() {
    if (!d3.event.shiftKey) {
      return;
    }

    var google = singleton.google;

    var frame = this;
    var center = d3.mouse(frame);

    // set selectionCoordinates, they are needed to pan the selection circle
    var centerPoint = new google.maps.Point(center[0], center[1]);
    var centerCoord = projection.fromContainerPixelToLatLng(centerPoint);

    selectionCircle.setCenter(centerCoord);
    selectionCircle.setRadius(0);
    selectionCircle.setVisible(true);

    var currentPoint;
    var meterDistance;

    d3.select(window)
      .on('mousemove', function() {
        var m = d3.mouse(frame);

        if (!options.view) {
          return;
        }

        currentPoint = new google.maps.Point(m[0], m[1]);
        currentCoord = projection.fromContainerPixelToLatLng(currentPoint);
        meterDistance = google.maps.geometry.spherical.computeDistanceBetween(
          centerCoord, currentCoord);

        selectionCircle.setRadius(meterDistance);
        selectPoints();

        var evt = {
          type: 'geo',
          source: 'geo',
          center: [centerCoord.lng(), centerCoord.lat()],
          distance: meterDistance / 1600
        };
        options.view.trigger('querybuilder', evt);
      })
      .on('mouseup', function() {
        d3.select(window)
          .on('mouseup', null)
          .on('mousemove', null);

        if (selectionCircle.getRadius() === 0) {
          selectionCircle.setVisible(false);

          d3.select(frame).selectAll('.marker circle')
            .classed('selected', false);

          var evt = {
            type: 'geo',
            source: 'geo'
          };
          options.view.trigger('querybuilder', evt);
          return;
        }

        evt = {
          type: 'geo',
          source: 'geo',
          center: [centerCoord.lng(), centerCoord.lat()],
          distance: meterDistance / 1600
        };
        options.view.trigger('querybuilder', evt);
      });
  }
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      if (!singleton.google) {
        GoogleMapsLoader.KEY = 'AIzaSyDrhE1qbcnNIh4sK3t7GEcbLRdCNKWjlt0';
        GoogleMapsLoader.LIBRARIES = ['geometry'];
        GoogleMapsLoader.load(function(g) {
          singleton.google = g;
          chart.call(this, selection);
        });
        return;
      }

      var google = singleton.google;

      var el = d3.select(this);
      var bounds = new google.maps.LatLngBounds();
      _.each(data, function(d) {
        var p = new google.maps.LatLng(d[1], d[0]);
        bounds.extend(p);
      });

      if (!googleMap) {
        // Create the Google Map
        googleMap = new google.maps.Map(el.node(), {
          disableDefaultUI: true,
          // disableDoubleClickZoom: true,
          scrollwheel: true,
          draggable: true,
          zoomControl: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: mapStyle
        });

        // Add the container when the overlay is added to the map.
        overlay = new google.maps.OverlayView();
        overlay.onAdd = function() {
          d3.select(this.getPanes().overlayMouseTarget).append('div')
            .attr('class', 'layer');
        }; // end overlay.onAdd

        // Draw each marker as a separate SVG element.
        overlay.draw = function() {
          var layer = d3.select('div.layer');
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

          function transform(d) {
            var p = new google.maps.LatLng(d[1], d[0]);
            p = projection.fromLatLngToDivPixel(p);
            d.x = p.x;
            d.y = p.y;
            var self = d3.select(this);
            self
              .style('left', p.x - padding + 'px')
              .style('top', p.y - padding + 'px');
            return self;
          }
        }; // end overlay.draw

        overlay.setMap(googleMap);
        el.on('mousedown', startSelection);

        d3.select('body')
        .on('keydown', onKeyDown)
        .on('keyup', onKeyUp);
      } // end if (!googleMap) ...

      // var innerWidth = width - margin.left - margin.right;
      // var innerHeight = height - margin.top - margin.bottom;

      googleMap.fitBounds(bounds);

      if (!selectionCircle) {
        selectionCircle = new google.maps.Circle({
          strokeColor: '#F68A1E',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#F68A1E',
          fillOpacity: 0.35,
          map: googleMap,
          center: { lat: 0, lng: 0 },
          radius: 0,
          visible: false,
          draggable: true
          // editable: true
        });

        selectionCircle.addListener('drag', function() {
          var centerCoord = selectionCircle.getCenter();
          selectPoints();
          var evt = {
            type: 'geo',
            source: 'geo',
            center: [centerCoord.lng(), centerCoord.lat()],
            distance: selectionCircle.getRadius() / 1600
          };
          options.view.trigger('querybuilder', evt);
        });
      }

      _.defer(function() {
        google.maps.event.trigger(googleMap, 'resize');
        googleMap.fitBounds(bounds);
      }, 100);
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

  chart.geoSelection = function(value) {
    if (!value) {
      selectionCircle.setVisible(false);
      selectionCircle.setRadius(0);
      selectPoints();
      return;
    }
    selectionCircle.setVisible(true);
    var c = new google.maps.LatLng(value[0][1], value[0][0]);
    selectionCircle.setCenter(c);
    selectionCircle.setRadius(value[1] * 1600);
    selectPoints();
  }

  return chart;
};

module.exports = minicharts_d3fns_geo;
