const d3 = require('d3');

function realTimeMouseOverlay() {
  let prefix = 'serverstats-overlay';
  let bubbleWidth = 30;
  let strokeWidth = 1;
  let enableMouse = true;
  let title = 'CHANGE ME';
  let eventDispatcher = null;

  function component(selection) {
    selection.each(function(data) {
      const svg = d3.select(this);
      const height = svg.attr('height');
      const width = svg.attr('width');
      const basePosition = width - (bubbleWidth / 2);

      // Create overlay marker
      const overlayGroupClass = `${prefix}-group`;
      const overlayGroup = svg.selectAll(`g.${overlayGroupClass}`).data([data]);
      overlayGroup.enter()
        .append('g')
        .attr('class', overlayGroupClass)
        .attr('transform', `translate(${basePosition})`);
      overlayGroup.selectAll('line').data([data]).enter()
        .append('line')
          .attr('stroke', 'white')
          .attr('class', `${prefix}-line`);
      overlayGroup.selectAll('line')
          .attr('x1', 0).attr('y1', height)
          .attr('x2', 0).attr('y2', 0);

      overlayGroup.selectAll('path').data([data]).enter()
        .append('path')
          .attr('stroke', 'white')
          .attr('fill', 'white')
          .attr('class', `${prefix}-triangle`)
          .attr('d', d3.svg.symbol().type('triangle-down').size(bubbleWidth * 3))
          .attr('stroke', 'white')
          .attr('stroke-width', strokeWidth);

      // Create mouse target for overlay events
      let updateMousePosition;
      function sendMouseEvents(xPosition) {
        clearInterval(updateMousePosition);
        xPosition = xPosition || d3.mouse(this)[0];
        if (eventDispatcher !== null) {
          eventDispatcher.dispatch.updateoverlay(xPosition);
        }
        updateMousePosition = setInterval(sendMouseEvents.bind(this, xPosition), 20);
      }

      const mouseTarget = svg.selectAll(`rect.${prefix}-mouse-target`).data([data])
        .attr('height', height - (bubbleWidth / 2))
        .attr('width', width - bubbleWidth);

      const mouseTargetEnter = mouseTarget.enter()
        .append('rect')
        .attr('class', `${prefix}-mouse-target`)
        .attr('fill', 'none')
        .attr('stroke', 'none')
        .attr('transform', `translate(${bubbleWidth / 2}, ${bubbleWidth / 2})`)
        .style('pointer-events', 'visible');

      if (enableMouse) {
        mouseTargetEnter
          .on('mouseover', function() {
            const xPosition = d3.mouse(this)[0];
            if (eventDispatcher !== null) {
              eventDispatcher.dispatch.mouseover(xPosition);
            }
          })
          .on('mousemove', sendMouseEvents)
          .on('mouseout', function() {
            clearInterval(updateMousePosition);
            if (eventDispatcher !== null) {
              eventDispatcher.dispatch.mouseout(basePosition);
            }
          });
      }

      if (overlayGroup.attr('transform') === `translate(${basePosition})`) {
        if (eventDispatcher !== null) {
          eventDispatcher.dispatch.updateoverlay();
        }
      }

      component.setPosition = function(xPosition) {
        overlayGroup.attr('transform', `translate(${xPosition})`);
      };
    });
  }

  component.title = function(value) {
    if (typeof value === 'undefined') return title;
    title = value;
    return component;
  };

  component.bubbleWidth = function(value) {
    if (typeof value === 'undefined') return bubbleWidth;
    bubbleWidth = value;
    return component;
  };

  component.on = function(event, cb) {
    if (eventDispatcher !== null) {
      eventDispatcher.on(title, event, cb);
    }
    return component;
  };

  component.prefix = function(value) {
    if (typeof value === 'undefined') return prefix;
    prefix = value;
    return component;
  };

  component.strokeWidth = function(value) {
    if (typeof value === 'undefined') return strokeWidth;
    strokeWidth = value;
    return component;
  };

  component.enableMouse = function(value) {
    if (typeof value === 'undefined') return enableMouse;
    enableMouse = value;
    return component;
  };

  component.eventDispatcher = function(value) {
    if (typeof value === 'undefined') return eventDispatcher;
    eventDispatcher = value;
    return component;
  };

  return component;
}

module.exports = realTimeMouseOverlay;
