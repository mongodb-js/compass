const d3 = require('d3');

/**
 * This function can be used to generate a dispatcher that can be provided to a real
 * time line chart. When the same dispatcher is provided to multiple real time line
 * charts, those charts will respond to any interaction on one chart as if it occurred
 * on all charts. It will also expose events for:
 * * newXValue - when the currently selected X value changes, this event is triggered
 *               with the currently selected X value
 * * mouseover - when the mouse enters the chart are, this evens is triggered with the
 *               xPosition of the mouse relative to the chart as its only argument
 * * mouseout - when the mouse exits the chart this event is trigger without arguments
 * * updateoverlay - internal event triggered with xPosition relative to the chart
 *                   when the overlay needs to be updated, because of mouse movement
 *                   or lack thereof
 **/

function realTimeDispatcher() {
  return d3.dispatch('mouseover', 'updateoverlay', 'mouseout', 'newXValue');
}

module.exports = realTimeDispatcher;
