var $ = require('jquery');
var View = require('ampersand-view');
var d3 = require('d3');
var _ = require('lodash');

var debug = require('debug')('mongodb-compass:explain:stage-view');

var stageTemplate = require('./stage-view.jade');
var shardTemplate = require('./shard-view.jade');

var zIndexCounter = 100;

module.exports = View.extend({
  template: stageTemplate,
  props: {
    detailsOpen: {
      type: 'boolean',
      default: false,
      required: true
    }
  },
  derived: {
    detailsJSON: {
      deps: ['model.details'],
      fn: function() {
        return JSON.stringify(this.model.details, null, ' ');
      }
    },
    posx: {
      deps: ['model.x', 'model.xoffset'],
      fn: function() {
        return this.model.x + this.model.xoffset;
      }
    },
    posy: {
      deps: ['model.y', 'model.yoffset'],
      fn: function() {
        return this.model.y + this.model.yoffset;
      }
    },
    deltaExecTime: {
      deps: ['model.curStageExecTimeMS', 'model.prevStageExecTimeMS'],
      fn: function() {
        return this.model.curStageExecTimeMS - this.model.prevStageExecTimeMS;
      }
    }
  },
  events: {
    'click [data-hook=details] > h4': 'detailsClicked'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    'model.nReturned': {
      hook: 'n-returned'
    },
    // 'model.curStageExecTimeMS': {
    deltaExecTime: { // only show the time THIS stage actually used up.
      hook: 'exec-ms'
    },
    'posx': {
      type: function(el, value) {
        $(el).css('left', value);
      }
    },
    'posy': {
      type: function(el, value) {
        $(el).css('top', value);
      }
    },
    'detailsJSON': {
      hook: 'stage-details'
    },
    detailsOpen: {
      type: 'booleanClass',
      name: 'open',
      hook: 'details'
    }
  },
  initialize: function() {
    if (this.model.isShard) {
      this.template = shardTemplate;
    }
    this.listenTo(this.model, 'change:totalExecTimeMS', this.drawArcs.bind(this));
  },
  render: function() {
    this.renderWithTemplate(this);
    this.drawArcs();
  },
  detailsClicked: function() {
    this.toggle('detailsOpen');
    $(this.query()).css('z-index', this.detailsOpen ? zIndexCounter++ : 'initial');
    this.parent.trigger('resize');
  },
  drawArcs: function() {
    // inputs from explain plan stage
    var totalExMillis = this.model.totalExecTimeMS;
    var curStageExMillis = this.model.curStageExecTimeMS;
    var prevStageExMillis = this.model.prevStageExecTimeMS;

    debug(this.model.name, totalExMillis, curStageExMillis, prevStageExMillis);

    // transforms to get the right percentage of arc for each piece of the clock
    var curArcStart = (prevStageExMillis / totalExMillis) * 2 * Math.PI;
    var curArcEnd = (curStageExMillis / totalExMillis) * 2 * Math.PI;

    var prevArcStart = 0;
    var prevArcEnd = curArcStart;

    var clockWidth = 60;
    var clockHeight = 60;
    // var τ = 2 * Math.PI;

    // An arc function with all values bound except the endAngle. So, to compute an
    // SVG path string for a given angle, we pass an object with an endAngle
    // property to the `arc` function, and it will return the corresponding string.
    var arcInit = d3.svg.arc();

    // Create the SVG container, and apply a transform such that the origin is the
    // center of the canvas. This way, we don't need to position arcs individually.
    var svgClock = d3.select(this.query('.clock')).selectAll('svg').data([null])
      .enter().append('svg')
      .attr('width', clockWidth)
      .attr('height', clockHeight)
      .append('g')
      .attr('transform', 'translate(' + clockWidth / 2 + ',' + clockHeight / 2 + ')');

    // Add the prevStageArc arc
    var prevStageArc = svgClock.append('path')
      .datum({endAngle: prevArcStart, startAngle: prevArcStart, innerRadius: 24, outerRadius: 29})
      // .style('stroke', '#bbb')
      .style('fill', '#dfdfdf')
      .attr('d', arcInit);

    // Add the curStageArc arc in blue
    var curStageArc = svgClock.append('path')
      .datum({endAngle: curArcStart, startAngle: curArcStart, innerRadius: 24, outerRadius: 29})
      .style('fill', '#43B1E5')
      .attr('d', arcInit);


    // arctween function taken from http://bl.ocks.org/mbostock/5100636 and adapted for two arcs
    var arcTween = function(transition, newEndAngle, newStartAngle) {
      transition.attrTween('d', function(d) {
        var interpolateEnd = d3.interpolate(d.endAngle, newEndAngle);
        var interpolateStart = d3.interpolate(d.endAngle, newStartAngle);

        return function(t) {
          d.startAngle = interpolateStart(t);
          d.endAngle = interpolateEnd(t);
          return arcInit(d);
        };
      });
    };

    // animate arc
    var animateArc = function(arcName, arcEnd, prvArcEnd, duration, delay) {
      arcName.transition()
        .duration(duration)
        .delay(delay)
        .call(arcTween, arcEnd, prvArcEnd);
    };

    _.defer(function() {
      // draw the gray arc
      animateArc(prevStageArc, prevArcEnd, 0, 0, 0);
      // draw the blue arc
      animateArc(curStageArc, curArcEnd, prevArcEnd, 0, 0);
    });
  }
  // calld3: function() {
  //   debug('calling d3');
  //   // inputs from explain plan stage
  //   var totalExMillis = 1300;
  //   var curStageExMillis = 934;
  //   var prevStageExMillis = 350;
  //
  //   // transforms to get the right percentage of arc for each piece of the clock
  //   var curArcStart = (prevStageExMillis / totalExMillis) * 2 * Math.PI;
  //   var curArcEnd = (curStageExMillis / totalExMillis) * 2 * Math.PI;
  //
  //   // var prevArcStart = 0;
  //   var prevArcEnd = curArcStart;
  //
  //   var width = 60;
  //   var height = 60;
  //   // var τ = 2 * Math.PI;
  //
  //   // An arc function with all values bound except the endAngle. So, to compute an
  //   // SVG path string for a given angle, we pass an object with an endAngle
  //   // property to the `arc` function, and it will return the corresponding string.
  //   var arcInit = d3.svg.arc();
  //
  //   // Create the SVG container, and apply a transform such that the origin is the
  //   // center of the canvas. This way, we don't need to position arcs individually.
  //   var svg = d3.select(this.query('.clock')).append('svg')
  //     .attr('width', width)
  //     .attr('height', height)
  //     .append('g')
  //     .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  //
  //   // Add the prevStageArc arc
  //   var prevStageArc = svg.append('path')
  //     .datum({endAngle: 0, startAngle: 0, innerRadius: 24, outerRadius: 29})
  //     // .style('stroke', '#bbb')
  //     .style('fill', '#dfdfdf')
  //     .attr('d', arcInit);
  //
  //   // Add the curStageArc arc in blue
  //   var curStageArc = svg.append('path')
  //     .datum({endAngle: prevArcEnd, startAngle: prevArcEnd, innerRadius: 24, outerRadius: 29})
  //     .style('fill', '#43B1E5')
  //     .attr('d', arcInit);
  //
  //   // arctween function taken from http://bl.ocks.org/mbostock/5100636 and adapted for two arcs
  //   var arcTween = function(transition, newEndAngle, newStartAngle) {
  //     transition.attrTween('d', function(d) {
  //       var interpolateEnd = d3.interpolate(d.endAngle, newEndAngle);
  //       var interpolateStart = d3.interpolate(d.endAngle, newStartAngle);
  //
  //       return function(t) {
  //         d.startAngle = interpolateStart(t);
  //         d.endAngle = interpolateEnd(t);
  //         return arcInit(d);
  //       };
  //     });
  //   };
  //
  //   // animate arc
  //   var animateArc = function(arcName, arcEnd, _prevArcEnd, duration, delay) {
  //     arcName.transition()
  //       .duration(duration)
  //       .delay(delay)
  //       .call(arcTween, arcEnd, _prevArcEnd);
  //   };
  //
  //
  //   // draw the gray arc
  //   animateArc(prevStageArc, prevArcEnd, 0, 250, 0);
  //   // draw the blue arc
  //   animateArc(curStageArc, curArcEnd, prevArcEnd, 750, 250);
  //
  //
  //   // set millis text value
  //   $(this.query('.face span')).html( curStageExMillis - prevStageExMillis);
  //   // then fade it in
  //   $(this.query('.face span')).delay(250).fadeTo(750, 1);
  //
  //   // when hovering the clock face
  //   $(this.query('.face')).mouseenter(function() {
  //     // reset the blue arc position so its basically 0 in length at the end of the gray arc
  //     animateArc(curStageArc, prevArcEnd, prevArcEnd, 0, 0);
  //     // then animate again
  //     animateArc(curStageArc, curArcEnd, prevArcEnd, 750, 125);
  //   })
  //   .mouseleave(function() {
  //     // console.log('leave');
  //   });
  //
  //   // hide and show details container
  //   $(this.query('.details h4')).click(function() {
  //     $(this.query('.details')).toggleClass('open');
  //     $(this.query('.details-output')).slideToggle( 125, function() {
  //       // Animation complete.
  //     });
  //   });
  // }
});
