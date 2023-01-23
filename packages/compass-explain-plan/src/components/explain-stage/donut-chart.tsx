import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

const drawArc = (
  svgElement: SVGSVGElement,
  startAngleDeg: number,
  endAngleDeg: number,
  strokeColor: string,
  strokeWidth: number
) => {
  if (!svgElement) return;

  const svgWidth = svgElement.width.baseVal.value;
  const svgHeight = svgElement.height.baseVal.value;
  const radius = Math.min(svgWidth, svgHeight) / 2;

  console.log({ svgWidth, radius });

  // convert degrees to radians
  const startAngle = (startAngleDeg * Math.PI) / 180;
  const endAngle = (endAngleDeg * Math.PI) / 180;

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
    .attr('transform', `translate(${svgWidth / 2},${svgHeight / 2})`)
    .style('fill', strokeColor);
};

interface DonutChartProps {
  data: { angle: number; color: string }[];
  width: number;
  height: number;
  strokeWidth: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  width,
  height,
  strokeWidth,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const svgElement = svgRef.current;

    // calculate the total angle of the chart
    let startAngle = 0;
    data.forEach((d) => {
      if (!svgRef.current) {
        return;
      }

      const endAngle = startAngle + d.angle;
      drawArc(svgRef.current, startAngle, endAngle, d.color, strokeWidth);
      startAngle = endAngle;
    });

    return () => {
      d3.select(svgElement).selectAll('path').remove();
    };
  }, [data, strokeWidth]);

  return <svg width={width} height={height} ref={svgRef}></svg>;
};

export default DonutChart;
