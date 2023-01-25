import React, { useRef, useEffect } from 'react';
import { map } from 'lodash';
import d3 from 'd3';
import { ExplainStage } from '../explain-stage';
import {
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

import STAGE_CARD_PROPERTIES from '../../constants/stage-card-properties';

interface ExplainTreeProps {
  nodes: any[];
  links: any[];
  width: number;
  height: number;
}

const explainTreeStyles = css({
  position: 'relative',
  zIndex: 0,
  margin: `${spacing[5]}px auto`,
});

const ExplainTree: React.FunctionComponent<ExplainTreeProps> = ({
  nodes,
  links,
  width,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const darkMode = useDarkMode();

  useEffect(() => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;

    // Right angle links between nodes
    const elbow = (d: {
      source: { x: number; y: number; x_size: number };
      target: { y: number; x: number; key: string };
    }): string => {
      return `M${d.source.x + d.source.x_size / 2},${d.source.y}
        V${d.target.y - STAGE_CARD_PROPERTIES.VERTICAL_PADDING / 2}
        H${d.target.x + STAGE_CARD_PROPERTIES.DEFAULT_CARD_WIDTH / 2}
        V${d.target.y}`;
    };
    const svg = d3.select(svgElement);

    // Links are svg elements
    const svgLinks = svg
      .selectAll('path')
      .data(links, (d) => d.target.key)
      .attr('d', elbow);

    svgLinks
      .enter()
      .append('path')
      .style({
        fill: 'none',
        stroke: darkMode ? palette.gray.base : palette.gray.light2,
        'stroke-width': '6px',
      })
      .attr('d', elbow);

    svgLinks.exit().remove();

    return () => {
      // make sure to clean up the elements from the previous hook execution
      d3.select(svgElement).selectAll('*').remove();
    };
  }, [nodes, links, darkMode]);

  const getStages = () => {
    return map(nodes, (stage) => <ExplainStage {...stage} />);
  };

  return (
    <div
      data-testid="explain-tree"
      className={explainTreeStyles}
      style={{ height, width }}
    >
      {getStages()}
      <svg width="100%" height="100%" ref={svgRef}></svg>
    </div>
  );
};

export default ExplainTree;
