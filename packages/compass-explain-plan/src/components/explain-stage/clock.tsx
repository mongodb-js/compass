import { palette, css, cx } from '@mongodb-js/compass-components';
import React, { useRef, useEffect, useMemo } from 'react';
import d3 from 'd3';
import drawArc from './donut-chart';
import DonutChart from './donut-chart';

const faceBackground =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDU3OERGNkYxMDc3MTFFNkFERTNCNTFDNjM1OERBQjUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDU3OERGNzAxMDc3MTFFNkFERTNCNTFDNjM1OERBQjUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpENTc4REY2RDEwNzcxMUU2QURFM0I1MUM2MzU4REFCNSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpENTc4REY2RTEwNzcxMUU2QURFM0I1MUM2MzU4REFCNSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsnVtQ4AAAaZSURBVHja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';

const clockRadius = 30;
const arcStrokeWidth = 3;
const clockWidth = clockRadius * 2;
const clockHeight = clockRadius * 2;
const size = { height: clockHeight, width: clockWidth };
const containerStyles = css({
  // background: `${palette.white} url(${faceBackground}) -1px -1px no-repeat`,
  backgroundSize: `${clockWidth}px ${clockHeight}px`,
  // border: `1px solid ${palette.gray.light2}`,
  borderRadius: '999px',
  fontSize: '10px',
  textAlign: 'center',
  transition: 'all 250ms ease-out',
  fontWeight: 'normal',
  color: `${palette.gray.base}`,
  ...size,
});

const faceContainerStyle = css({
  position: 'relative',
  ...size,
  top: -1,
  left: -1,
});

const arcContainerStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  ...size,
});

const executionTimeStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  ...size,
});

const msecsStyle = css({
  display: 'block',
  fontSize: '14px',
  fontWeight: 'bold',
  paddingTop: '11px',
  color: `${palette.blue.light1}`,
});

// function drawArc(
//   clock: SVGSVGElement,
//   totalExMillis: number,
//   curStageExMillis: number,
//   prevStageExMillis: number,
//   clockWidth: number,
//   clockHeight: number
// ) {
//   // Transforms to get the right percentage of arc for each piece of the clock
//   const curArcStart = -((curStageExMillis / totalExMillis) * 2 * Math.PI || 0);
//   const curArcEnd = -((prevStageExMillis / totalExMillis) * 2 * Math.PI || 0);

//   const prevArcStart = -0.1;
//   const prevArcEnd = curArcEnd;

//   console.log({
//     totalExMillis,
//     curStageExMillis,
//     prevStageExMillis,
//     curArcStart,
//     curArcEnd,
//     prevArcStart,
//     prevArcEnd,
//   });

//   const arcGen = d3.svg.arc();

//   // Create the SVG container, and apply a transform such that the origin is the
//   // center of the canvas. This way, we don't need to position arcs individually.
//   const svgClock = d3
//     .select(clock)
//     .selectAll('svg')
//     .data([null])
//     .enter()
//     .append('svg')
//     .attr('width', clockWidth)
//     .attr('height', clockHeight)
//     .append('g')
//     .attr('transform', `translate(${clockRadius}, ${clockRadius})`);

//   if (prevArcEnd || prevArcStart) {
//     // Add the prevStageArc arc
//     svgClock
//       .append('path')
//       .attr('class', 'prevArcPath')
//       .style('fill', palette.gray.light2);

//     d3.select(clock)
//       .select('.prevArcPath')
//       .attr(
//         'd',
//         arcGen({
//           startAngle: prevArcEnd,
//           endAngle: prevArcStart,
//           innerRadius: clockRadius - arcStrokeWidth,
//           outerRadius: clockRadius,
//           padAngle: 0,
//         })
//       );
//   }

//   // Add the curStageArc arc in blue
//   svgClock
//     .append('path')
//     .attr('class', 'currArcPath')
//     .style('fill', palette.blue.light1);

//   d3.select(clock)
//     .select('.currArcPath')
//     .attr(
//       'd',
//       arcGen({
//         startAngle: curArcStart,
//         endAngle: curArcEnd,
//         innerRadius: clockRadius - arcStrokeWidth,
//         outerRadius: clockRadius,
//         padAngle: 0,
//       })
//     );
// }

type ClockProps = {
  totalExMillis: number;
  curStageExMillis: number;
  prevStageExMillis: number;
  className?: string;
};

const getAngles = (totalTime: number, startTime: number, endTime: number) => {
  const startAngle = (360 * startTime) / totalTime;
  const endAngle = (360 * endTime) / totalTime;
  return { startAngle, endAngle };
};

const Clock: React.FunctionComponent<ClockProps> = ({
  totalExMillis,
  curStageExMillis,
  prevStageExMillis,
  className,
}) => {
  const clockRef = useRef<SVGSVGElement>(null);
  const deltaExecTime = useMemo(
    () => curStageExMillis - prevStageExMillis,
    [curStageExMillis, prevStageExMillis]
  );
  // useEffect(() => {
  //   if (clockRef.current) {
  //     // Call drawArc function here and pass the needed variables as arguments
  //     const { startAngle, endAngle } = getAngles(
  //       totalExMillis,
  //       prevStageExMillis,
  //       curStageExMillis
  //     );
  //     drawArc(clockRef.current, startAngle, endAngle, palette.blue.light1, 3);
  //   }
  // }, [clockRef, totalExMillis, curStageExMillis, prevStageExMillis]);

  const getAngles = (totalTime: number, startTime: number, endTime: number) => {
    const startAngle = (360 * startTime) / totalTime;
    const endAngle = (360 * endTime) / totalTime;
    return { startAngle, endAngle };
  };

  const { startAngle, endAngle } = getAngles(
    totalExMillis,
    prevStageExMillis,
    curStageExMillis
  );

  return (
    <div className={cx(className, containerStyles)}>
      <div className={faceContainerStyle}>
        <div className={executionTimeStyles}>
          <span className={msecsStyle}>{deltaExecTime}</span>
          ms
        </div>
        <DonutChart
          width={clockWidth}
          height={clockHeight}
          strokeWidth={3}
          data={[
            {
              angle: startAngle,
              color: palette.green.light1,
            },
            {
              angle: endAngle,
              color: palette.blue.light1,
            },
            {
              angle: 360,
              color: palette.gray.light1,
            },
          ]}
        ></DonutChart>
      </div>
    </div>
  );
};

export { Clock };
