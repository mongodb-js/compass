import { palette, css, cx, useDarkMode } from '@mongodb-js/compass-components';
import d3 from 'd3';
import React, { useEffect, useMemo, useRef } from 'react';

const lightModeColors = {
  clockBackgroundColor: palette.white,
  clockFaceColor: palette.gray.light1,
  textColor: palette.gray.dark1,
  msColor: palette.blue.light1,
  previusElapsedArcColor: palette.gray.light1,
  currentElapsedArcColor: palette.blue.light1,
};

const darkModeColors = {
  clockBackgroundColor: palette.black,
  clockFaceColor: palette.gray.dark1,
  textColor: palette.gray.dark1,
  msColor: palette.blue.light1,
  previusElapsedArcColor: palette.gray.dark1,
  currentElapsedArcColor: palette.blue.light1,
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
});

const msecsStyles = css({
  display: 'block',
  fontSize: '14px',
  fontWeight: 'bold',
  paddingTop: '11px',
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
  previusElapsedArcColor,
  currentElapsedArcColor,
}: {
  svgElement: SVGSVGElement;
  strokeWidth: number;
  width: number;
  height: number;
  totalExecTimeMS: number;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  previusElapsedArcColor: string;
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
      fill: previusElapsedArcColor,
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
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
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
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const longLineLength = 0.25 * radius;
  const shortLineLength = 0.16 * radius;

  angles.forEach((angle) => {
    const length = angle % 10 === 0 ? longLineLength : shortLineLength;
    d3.select(svgElement)
      .append('line')
      .attr(
        'x1',
        radius + (radius - length) * Math.sin(angle * (Math.PI / 180))
      )
      .attr(
        'y1',
        radius - (radius - length) * Math.cos(angle * (Math.PI / 180))
      )
      .attr('x2', radius + radius * Math.sin(angle * (Math.PI / 180)))
      .attr('y2', radius - radius * Math.cos(angle * (Math.PI / 180)))
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2);
  });
}

type ClockProps = {
  totalExecTimeMS: number;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  width: number;
  height: number;
  className?: string;
};

const Clock: React.FunctionComponent<ClockProps> = ({
  totalExecTimeMS,
  curStageExecTimeMS,
  prevStageExecTimeMS,
  className,
  width,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const deltaExecTime = useMemo(
    () => curStageExecTimeMS - prevStageExecTimeMS,
    [curStageExecTimeMS, prevStageExecTimeMS]
  );

  const darkmode = useDarkMode();

  const {
    clockFaceColor,
    clockBackgroundColor,
    previusElapsedArcColor,
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
      width: width,
      height: height,
      strokeColor: clockFaceColor,
      fillColor: clockBackgroundColor,
      svgElement,
    });

    drawElapsedTimes({
      width: width,
      height: height,
      strokeWidth: 3,
      svgElement,
      curStageExecTimeMS,
      prevStageExecTimeMS,
      totalExecTimeMS,
      previusElapsedArcColor,
      currentElapsedArcColor,
    });

    return () => {
      cleanup();
    };
  }, [
    curStageExecTimeMS,
    prevStageExecTimeMS,
    totalExecTimeMS,
    width,
    height,
    clockBackgroundColor,
    clockFaceColor,
    previusElapsedArcColor,
    currentElapsedArcColor,
  ]);

  return (
    <div
      className={cx(
        className,
        containerStyles,
        darkmode ? containerStylesDarkMode : containerStylesLightMode
      )}
      style={{ width, height }}
    >
      <div className={faceContainerStyle} style={{ width, height }}>
        <svg
          width={width}
          height={height}
          ref={svgRef}
          className={svgStyles}
        ></svg>
        <div className={executionTimeStyles} style={{ width, height }}>
          <span
            className={cx(
              msecsStyles,
              darkmode ? msecsStylesDarkMode : msecsStylesLightMode
            )}
          >
            {deltaExecTime}
          </span>
          ms
        </div>
      </div>
    </div>
  );
};

export { Clock };
