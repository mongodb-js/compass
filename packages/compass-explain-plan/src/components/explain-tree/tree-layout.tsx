import React, { useRef, useMemo } from 'react';
import { flextree } from 'd3-flextree';
import { css } from '@mongodb-js/compass-components';
import type { FlextreeNode } from 'd3-flextree';
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy';

interface TreeLayoutProps<T>
  extends Omit<React.HTMLProps<HTMLDivElement>, 'data'> {
  data: T;
  getNodeSize: (node: T) => [number, number];
  getNodeKey: (node: T) => string;
  linkColor: string;
  linkWidth: number;
  verticalSpacing: number;
  horizontalSpacing: number;
  children: (node: T) => React.ReactElement | null;
}

/**
 * Renders a link path between a source node and a target node in the hierarchical
 * layout.
 *
 * If the source and target nodes have the same x-coordinates, the link is drawn
 * as a straight line between them.
 *
 * Otherwise, an elbow is drawn half way through the bottom of the source node
 * and the top of the target node.
 */
function LinkPath<T>({
  translateX,
  gapY = 0,
  link,
  linkColor,
  linkWidth,
}: {
  translateX: number;
  gapY?: number;
  link: HierarchyLink<T>;
  linkColor: string;
  linkWidth: number;
}) {
  const pathDef = useMemo(() => {
    const source = link.source as FlextreeNode<T>;
    const target = link.target as FlextreeNode<T>;
    const sourceX = translateX + source.x;
    const targetX = translateX + target.x;
    const sourceY = source.y;
    const targetY = target.y;
    const actualSourceYSize = source.ySize - gapY;
    const linkStartX = sourceX;
    const linkStartY = sourceY + actualSourceYSize / 2;
    const linkEndX = targetX;
    const linkEndY = targetY;

    // same X:
    // we draw as straight line between the nodes.
    if (sourceX === targetX) {
      return `M ${linkStartX} ${linkStartY} V ${linkEndY}`;
    }

    // different X:
    // we draw an elbow half way through the bottom of the source node
    // and the top of the target.
    const sourceBottomY = sourceY + actualSourceYSize;
    const elbowY = sourceBottomY + (targetY - sourceBottomY) / 2;

    return `M ${linkStartX} ${linkStartY} V ${elbowY} H ${linkEndX} V ${linkEndY}`;
  }, [gapY, link.source, link.target, translateX]);

  return (
    <path fill="none" stroke={linkColor} strokeWidth={linkWidth} d={pathDef} />
  );
}

const treeContainerStyles = css({
  position: 'relative',
  margin: '0 auto',
});

function TreeLayout<T>({
  data,
  getNodeSize,
  getNodeKey,
  linkColor,
  linkWidth,
  horizontalSpacing,
  verticalSpacing,
  children,
  ...divProps
}: TreeLayoutProps<T>) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { translateX, width, height, nodes, links } = useMemo(() => {
    const layout = flextree<T>({
      nodeSize: (node: HierarchyNode<T>) => {
        const nodeData: T = node.data;
        const [xSize, ySize] = getNodeSize(nodeData);

        // flextree doesn't have a concept of vertical spacing between the nodes,
        // to overcome this limitation we add more space to the height of the node
        // and we account for that when generating the links.
        return [xSize, ySize + verticalSpacing];
      },
      spacing: horizontalSpacing,
    });

    const tree = layout.hierarchy(data);
    const treeLayout = layout(tree);

    const nodes = treeLayout.descendants();
    const links = treeLayout.links();

    return {
      translateX: -treeLayout.extents.left,
      width: treeLayout.extents.right - treeLayout.extents.left,
      height: treeLayout.extents.bottom - treeLayout.extents.top,
      nodes,
      links,
    };
  }, [data, getNodeSize, verticalSpacing, horizontalSpacing]);

  return (
    <div {...divProps}>
      <div style={{ width, height }} className={treeContainerStyles}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <g>
            {links.map((link, i) => (
              <LinkPath<T>
                key={i}
                link={link}
                gapY={verticalSpacing}
                translateX={translateX}
                linkColor={linkColor}
                linkWidth={linkWidth}
              ></LinkPath>
            ))}
          </g>
        </svg>

        {nodes.map((node) => (
          <div
            key={getNodeKey(node.data)}
            style={{
              position: 'absolute',
              left: node.left + translateX,
              top: node.top,
              width: node.xSize,
              height: node.ySize,
            }}
          >
            {children(node.data)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TreeLayout;
