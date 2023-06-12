import { palette, css, cx, useDarkMode } from '@mongodb-js/compass-components';
import d3 from 'd3';
import React, { useEffect, useMemo, useRef } from 'react';
import { milliSecondsToNormalisedValue } from './explain-tree-stage';

const lightModeColors = {
  clockBackgroundColor: palette.white,
  clockFaceColor: palette.gray.light1,
  textColor: palette.gray.base,
  msColor: palette.blue.base,
  previousElapsedArcColor: palette.gray.light2,
  currentElapsedArcColor: palette.blue.base,
};

const darkModeColors = {
  clockBackgroundColor: palette.black,
  clockFaceColor: palette.gray.light1,
  textColor: palette.gray.base,
  msColor: palette.blue.light2,
  previousElapsedArcColor: palette.gray.dark2,
  currentElapsedArcColor: palette.blue.light2,
};

const containerStyles = css({
  fontWeight: 'normal',
  fontSize: '10px',
  textAlign: 'center',
});

const containerStylesLightMode = css({
  color: lightModeColors.textColor,
});

const containerStylesDarkMode = css({
  color: darkModeColors.textColor,
});

const faceContainerStyle = css({
  position: 'relative',
});

const executionTimeStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

const msecsStyles = css({
  fontWeight: 'bold',
  fontSize: '13px',
  lineHeight: '13px',
});

const msStyles = css({
  fontSize: '11px',
  lineHeight: '11px',
});

const msecsStylesLightMode = css({
  color: lightModeColors.msColor,
});

const msecsStylesDarkMode = css({
  color: darkModeColors.msColor,
});

const svgStyles = css({ position: 'absolute', top: 0, left: 0 });

function drawElapsedTimes({
  svgElement,
  strokeWidth,
  width,
  height,
  totalExecTimeMS,
  curStageExecTimeMS,
  prevStageExecTimeMS,
  previousElapsedArcColor,
  currentElapsedArcColor,
}: {
  svgElement: SVGSVGElement;
  strokeWidth: number;
  width: number;
  height: number;
  totalExecTimeMS: number;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  previousElapsedArcColor: string;
  currentElapsedArcColor: string;
}) {
  // Transforms to get the right percentage of arc for each piece of the clock
  const curArcStart =
    (prevStageExecTimeMS / totalExecTimeMS) * 2 * Math.PI || 0;
  const curArcEnd = (curStageExecTimeMS / totalExecTimeMS) * 2 * Math.PI || 0;

  const prevArcStart = 0;
  const prevArcEnd = curArcStart;

  const radius = Math.min(width, height) / 2;

  const arcs = [
    {
      startAngle: prevArcStart,
      endAngle: prevArcEnd,
      fill: previousElapsedArcColor,
    },
    {
      startAngle: curArcStart,
      endAngle: curArcEnd,
      fill: currentElapsedArcColor,
    },
  ];

  arcs.forEach(({ startAngle, endAngle, fill }) => {
    const svgArc = d3.svg
      .arc()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .startAngle(startAngle)
      .endAngle(endAngle);

    const d3Svg = d3.select(svgElement);
    d3Svg
      .append('path')
      .attr('d', svgArc)
      .attr('transform', `translate(${width / 2},${height / 2})`)
      .style('fill', fill);
  });
}

function drawClockFace({
  width,
  height,
  strokeColor,
  fillColor,
  svgElement,
}: {
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  svgElement: SVGSVGElement;
}) {
  const radius = Math.min(width, height) / 2;

  // background
  d3.select(svgElement)
    .append('path')
    .attr(
      'd',
      d3.svg
        .arc()
        .innerRadius(0)
        .outerRadius(radius - 1)
        .startAngle(0)
        .endAngle(2 * Math.PI)
    )
    .attr('transform', `translate(${width / 2},${height / 2})`)
    .style('fill', fillColor);

  // border
  d3.select(svgElement)
    .append('path')
    .attr(
      'd',
      d3.svg
        .arc()
        .innerRadius(radius - 1)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle(2 * Math.PI)
    )
    .attr('transform', `translate(${width / 2},${height / 2})`)
    .style('fill', strokeColor);

  // clock position lines
  const ANGLE_LINE_WIDTH = 1;
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  angles.forEach((angle) => {
    const ANGLE_LINE_LENGTH = 0.3 * radius;
    d3.select(svgElement)
      .append('line')
      .attr(
        'x1',
        radius +
          (radius - ANGLE_LINE_LENGTH) * Math.sin(angle * (Math.PI / 180))
      )
      .attr(
        'y1',
        radius -
          (radius - ANGLE_LINE_LENGTH) * Math.cos(angle * (Math.PI / 180))
      )
      .attr('x2', radius + radius * Math.sin(angle * (Math.PI / 180)))
      .attr('y2', radius - radius * Math.cos(angle * (Math.PI / 180)))
      .attr('stroke', strokeColor)
      .attr('stroke-width', ANGLE_LINE_WIDTH);
  });
}

export type ClockProps = {
  totalExecTimeMS: number;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  className?: string;
};

const CLOCK_WIDTH = 50;
const CLOCK_HEIGHT = 50;
const ARC_STROKE_WIDTH = 5;

const Clock: React.FunctionComponent<ClockProps> = ({
  totalExecTimeMS,
  curStageExecTimeMS,
  prevStageExecTimeMS,
  className,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const { value: normalisedDeltaExecTime, unit: normalisedDeltaExecTimeUnit } =
    useMemo(() => {
      const deltaExecTime = curStageExecTimeMS - prevStageExecTimeMS;
      return milliSecondsToNormalisedValue(deltaExecTime);
    }, [curStageExecTimeMS, prevStageExecTimeMS]);

  const darkmode = useDarkMode();

  const {
    clockFaceColor,
    clockBackgroundColor,
    previousElapsedArcColor,
    currentElapsedArcColor,
  } = useMemo(() => {
    return darkmode ? darkModeColors : lightModeColors;
  }, [darkmode]);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }
    const svgElement = svgRef.current;

    const cleanup = () => {
      // make sure to clean up the elements from the previous hook execution
      d3.select(svgElement).selectAll('*').remove();
    };

    drawClockFace({
      width: CLOCK_WIDTH,
      height: CLOCK_HEIGHT,
      strokeColor: clockFaceColor,
      fillColor: clockBackgroundColor,
      svgElement,
    });

    drawElapsedTimes({
      width: CLOCK_WIDTH,
      height: CLOCK_HEIGHT,
      strokeWidth: ARC_STROKE_WIDTH,
      svgElement,
      curStageExecTimeMS,
      prevStageExecTimeMS,
      totalExecTimeMS,
      previousElapsedArcColor,
      currentElapsedArcColor,
    });

    return () => {
      cleanup();
    };
  }, [
    curStageExecTimeMS,
    prevStageExecTimeMS,
    totalExecTimeMS,
    clockBackgroundColor,
    clockFaceColor,
    previousElapsedArcColor,
    currentElapsedArcColor,
  ]);

  return (
    <div
      className={cx(
        className,
        containerStyles,
        darkmode ? containerStylesDarkMode : containerStylesLightMode
      )}
      style={{ width: CLOCK_WIDTH, height: CLOCK_HEIGHT }}
    >
      <div
        className={faceContainerStyle}
        style={{ width: CLOCK_WIDTH, height: CLOCK_HEIGHT }}
      >
        <svg
          width={CLOCK_WIDTH}
          height={CLOCK_HEIGHT}
          ref={svgRef}
          className={svgStyles}
          // Our svg clock has additional arcs that expands outside of the clock
          // radius which is === width supplied here so to avoid the
          // out-rendered arcs from being cut-off because of dimension restrains
          // we configure our svg viewbox to zoom out the svg and transpose it
          // to exact center
          viewBox="-3 -3 56 56"
        ></svg>
        <div
          className={executionTimeStyles}
          style={{ width: CLOCK_WIDTH, height: CLOCK_HEIGHT }}
        >
          <span
            className={cx(
              msecsStyles,
              darkmode ? msecsStylesDarkMode : msecsStylesLightMode
            )}
          >
            {normalisedDeltaExecTime}
          </span>
          <span className={msStyles}>{normalisedDeltaExecTimeUnit}</span>
        </div>
      </div>
    </div>
  );
};

export { Clock };
