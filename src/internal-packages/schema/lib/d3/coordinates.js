/* eslint camelcase: 0 */
const d3 = require('d3');
const _ = require('lodash');
const shared = require('./shared');
const app = require('ampersand-app');
const turfDistance = require('turf-distance');
const turfPoint = require('turf-point');
const turfDestination = require('turf-destination');

// const metrics = require('mongodb-js-metrics')();
// const debug = require('debug')('mongodb-compass:minicharts:geo');

const QueryAction = app.appRegistry.getAction('Query.Actions');

const SELECTED_COLOR = '#F68A1E';
const UNSELECTED_COLOR = '#43B1E5';
const CONTROL_COLOR = '#ed271c';
const TOKEN = 'pk.eyJ1IjoibW9uZ29kYi1jb21wYXNzIiwiYSI6ImNpbWUxZjNudjAwZTZ0emtrczByanZ4MzIifQ.6Mha4zoflraopcZKOLSpYQ';

const MAPBOX_API_URL = 'https://compass-maps.mongodb.com/api.mapbox.com';
const MAPBOX_CLIENT_URL = MAPBOX_API_URL + '/mapbox-gl-js/v0.15.0/mapbox-gl.js';

const minicharts_d3fns_geo = function() {
  // --- beginning chart setup ---
  let width = 400;
  let height = 100;
  let map = null;
  let circleControl;
  let mapboxgl;

  const options = {
    view: null
  };

  let circleCenter;
  let circleOuter; // control points
  let mileDistance;
  let circleSelected = false; // have we completed the circle?
  let svg;
  let render;
  let dots;

  const margin = shared.margin;

  function CircleSelector(container) {
    let dragging = false; // track whether we are dragging

    // we expose events on our component
    const dispatch = d3.dispatch('update', 'clear');

    // this will likely be overriden by leaflet projection
    let project;
    let unproject;

    // const project = d3.geo.mercator();
    // const unproject = d3.geo.mercator().invert;

    let update = null;

    function querybuilder() {
      if (circleCenter && circleOuter) {
        mileDistance = turfDistance(
          turfPoint([circleCenter.lng, circleCenter.lat]),
          turfPoint([circleOuter.lng, circleOuter.lat]),
          'miles'
        );
        QueryAction.setGeoWithinValue({
          field: options.fieldName,
          center: [circleCenter.lng, circleCenter.lat],
          radius: mileDistance / 3963.2
        });
      } else {
        QueryAction.clearValue({
          field: options.fieldName
        });
      }
    }

    function distance(ll0, ll1) {
      const p0 = project(ll0);
      const p1 = project(ll1);
      const dist = Math.sqrt((p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y));
      return dist;
    }

    const drag = d3.behavior.drag()
      .on('drag', function(d, i) {
        if (circleSelected) {
          dragging = true;
          const p = d3.mouse(container.node());
          const ll = unproject([p[0], p[1]]);
          if (i) {
            circleOuter = ll;
          } else {
            const dlat = circleCenter.lat - ll.lat;
            const dlng = circleCenter.lng - ll.lng;
            circleCenter = ll;
            circleOuter.lat -= dlat;
            circleOuter.lng -= dlng;
          }
          update();
          querybuilder();
        } else {
          return;
        }
      })
      .on('dragend', function() {
        // kind of a dirty hack...
        setTimeout(function() {
          dragging = false;
          querybuilder();
        }, 100);
      });

    function clear(dontUpdate) {
      circleCenter = null;
      circleOuter = null;
      circleSelected = false;
      container.selectAll('circle.lasso').remove();
      container.selectAll('circle.control').remove();
      container.selectAll('line.lasso').remove();
      dispatch.clear();
      if (!dontUpdate) {
        querybuilder();
      }
      return;
    }

    this.clear = clear;

    update = function(g) {
      if (g) {
        container = g;
      }
      if (!circleCenter || !circleOuter) return;
      const dist = distance(circleCenter, circleOuter);
      const circleLasso = container.selectAll('circle.lasso').data([dist]);
      circleLasso.enter().append('circle')
        .classed('lasso', true)
        .style({
          stroke: SELECTED_COLOR,
          'stroke-width': 2,
          fill: SELECTED_COLOR,
          'fill-opacity': 0.1
        });

      circleLasso
      .attr({
        cx: project(circleCenter).x,
        cy: project(circleCenter).y,
        r: dist
      });

      const line = container.selectAll('line.lasso').data([circleOuter]);
      line.enter().append('line')
        .classed('lasso', true)
        .style({
          stroke: CONTROL_COLOR,
          'stroke-dasharray': '2 2'
        });

      line.attr({
        x1: project(circleCenter).x,
        y1: project(circleCenter).y,
        x2: project(circleOuter).x,
        y2: project(circleOuter).y
      });

      const controls = container.selectAll('circle.control')
      .data([circleCenter, circleOuter]);
      controls.enter().append('circle')
        .classed('control', true)
        .style({
          'cursor': 'move'
        });

      controls.attr({
        cx: function(d) { return project(d).x; },
        cy: function(d) { return project(d).y; },
        r: 5,
        stroke: CONTROL_COLOR,
        fill: CONTROL_COLOR,
        'fill-opacity': 0.7
      })
      .call(drag)
      .on('mousedown', function() {
        map.dragPan.disable();
      })
      .on('mouseup', function() {
        map.dragPan.enable();
      });

      dispatch.update();
    }; // end update()
    this.update = update;

    function setCircle(centerLL, radiusMiles) {
      const pCenter = turfPoint([centerLL[0], centerLL[1]]);
      const pOuter = turfDestination(pCenter, radiusMiles, 45, 'miles');
      circleCenter = mapboxgl.LngLat.convert(pCenter.geometry.coordinates);
      circleOuter = mapboxgl.LngLat.convert(pOuter.geometry.coordinates);
      circleSelected = true;
      update();
    }
    this.setCircle = setCircle;

    container.on('mousedown.circle', function() {
      if (!d3.event.shiftKey) return;
      if (dragging && circleSelected) return;
      if (!dragging && circleSelected) {
        // reset and remove circle
        clear();
        return;
      }

      map.dragPan.disable();
      const p = d3.mouse(this);
      const ll = unproject([p[0], p[1]]);

      if (!circleCenter) {
        // We set the center to the initial click
        circleCenter = ll;
        circleOuter = ll;
      }
      update();
    });

    container.on('mousemove.circle', function() {
      if (circleSelected || !circleCenter) return;
      // we draw a guideline for where the next point would go.
      const p = d3.mouse(this);
      const ll = unproject([p[0], p[1]]);
      circleOuter = ll;
      update();
      querybuilder();
    });

    container.on('mouseup.circle', function() {
      if (dragging && circleSelected) return;

      map.dragPan.enable();

      const p = d3.mouse(this);
      const ll = unproject([p[0], p[1]]);

      if (circleCenter) {
        if (!circleSelected) {
          circleOuter = ll;
          circleSelected = true;
          querybuilder();
        }
      }
    });

    this.projection = function(val) {
      if (!val) return project;
      project = val;
      return this;
    };

    this.inverseProjection = function(val) {
      if (!val) return unproject;
      unproject = val;
      return this;
    };

    this.distance = function(ll) {
      if (!ll) ll = circleOuter;
      return distance(circleCenter, ll);
    };

    d3.rebind(this, dispatch, 'on');
    return this;
  }

  function disableMapsFeature() {
    // disable in preferences and persist
    app.preferences.save('googleMaps', false);
    delete window.google;
    // options.view.parent.render();
  }

  function loadMapBoxScript(done) {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.src = MAPBOX_CLIENT_URL;
    script.onerror = function() {
      done('Error ocurred while loading MapBox script.');
    };
    script.onload = function() {
      window.mapboxgl.config.API_URL = MAPBOX_API_URL;
      done(null, window.mapboxgl);
    };
    document.getElementsByTagName('head')[0].appendChild(script);
  }


  function selectFromQuery() {
    if (options.query === undefined) {
      circleControl.clear(true);
    } else {
      const center = options.query.$geoWithin.$centerSphere[0];
      const radius = options.query.$geoWithin.$centerSphere[1] * 3963.2;
      // only redraw if the center/radius is different to the existing circle
      if (radius !== mileDistance || !_.isEqual(center, [circleCenter.lng, circleCenter.lat])) {
        circleControl.setCircle(center, radius);
      }
    }
  }
  // --- end chart setup ---

  function chart(selection) {
    // load mapbox script
    if (!window.mapboxgl) {
      loadMapBoxScript(function(err) {
        if (err) {
          disableMapsFeature();
        } else {
          chart.call(this, selection);
        }
      });
      return;
    }
    mapboxgl = window.mapboxgl;

    selection.each(function(data) {
      function getLL(d) {
        if (d instanceof mapboxgl.LngLat) return d;
        return new mapboxgl.LngLat(+d[0], +d[1]);
      }
      function project(d) {
        return map.project(getLL(d));
      }

      const el = d3.select(this);
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // append inner div once
      const innerDiv = el.selectAll('div.map').data([null]);
      innerDiv.enter().append('div')
        .attr('class', 'map');

      innerDiv
        .style({
          width: innerWidth + 'px',
          height: innerHeight + 'px',
          padding: margin.top + 'px ' + margin.right + 'px ' + margin.bottom
            + 'px ' + margin.left + 'px;'
        });

      // append info sprinkle
      el.selectAll('i.help').data([null]).enter().append('i')
        .classed('help', true)
        .attr('data-hook', 'schema-geo-query-builder');

      // compute bounds from data
      const bounds = new mapboxgl.LngLatBounds();
      _.each(data, function(d) {
        bounds.extend(getLL(d));
      });

      // create the map once
      if (!map) {
        mapboxgl.accessToken = TOKEN;
        map = new mapboxgl.Map({
          container: innerDiv[0][0],
          // not allowed to whitelabel the map without enterprise license
          // attributionControl: false,
          style: 'mapbox://styles/mapbox/light-v8',
          center: bounds.getCenter()
        });
        map.dragPan.enable();
        map.scrollZoom.enable();
        map.boxZoom.disable();

        // Add zoom and rotation controls to the map
        map.addControl(new mapboxgl.Navigation({position: 'top-left'}));

        // Setup our svg layer that we can manipulate with d3
        const container = map.getCanvasContainer();
        svg = d3.select(container).append('svg');

        circleControl = new CircleSelector(svg)
          .projection(project)
          .inverseProjection(function(a) {
            return map.unproject({x: a[0], y: a[1]});
          });

        // when lasso changes, update point selections
        circleControl.on('update', function() {
          svg.selectAll('circle.dot').style({
            fill: function(d) {
              const thisDist = circleControl.distance(d);
              const circleDist = circleControl.distance();
              if (thisDist < circleDist) {
                return SELECTED_COLOR;
              }
              return UNSELECTED_COLOR;
            }
          });
        });
        circleControl.on('clear', function() {
          svg.selectAll('circle.dot').style('fill', UNSELECTED_COLOR);
        });

        /* eslint no-inner-declarations: 0 */
        render = function() {
          // update points
          dots.attr({
            cx: function(d) {
              const x = project(d).x;
              return x;
            },
            cy: function(d) {
              const y = project(d).y;
              return y;
            }
          });
          // update circle
          circleControl.update(svg);
        };

        // re-render our visualization whenever the view changes
        map.on('viewreset', function() {
          render();
        });
        map.on('move', function() {
          render();
        });

        _.defer(function() {
          map.resize();
          map.fitBounds(bounds, {
            linear: true,
            padding: 20
          });
        });
      } // end if (!map) ...

      // draw data points
      dots = svg.selectAll('circle.dot')
        .data(data);
      dots.enter().append('circle').classed('dot', true)
      .attr('r', 4)
      .style({
        fill: UNSELECTED_COLOR,
        stroke: 'white',
        'stroke-opacity': 0.6,
        'stroke-width': 1
      });

      selectFromQuery();
      render();
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
      circleControl.clear();
      return;
    }
    circleControl.setCircle(value[0], value[1]);
  };

  return chart;
};

module.exports = minicharts_d3fns_geo;
