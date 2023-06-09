import React, { useRef, useMemo } from 'react';
import { flextree } from 'd3-flextree';
import { css } from '@mongodb-js/compass-components';
import type { FlextreeNode } from 'd3-flextree';
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy';

interface TreeLayoutProps<T, X>
  extends Omit<React.HTMLProps<HTMLDivElement>, 'data'> {
  data: T;
  getNodeSize: (node: T) => [number, number];
  getNodeKey: (node: T) => string;
  getLinkWidth: (sourceNodeData: T, targetNodeData: T, metaData?: X) => number;
  linkColor: string;
  arrowColor: string;
  verticalSpacing: number;
  horizontalSpacing: number;
  children: (node: T) => React.ReactElement | null;
  scale?: number;
}

interface LinkPathProps<T> {
  translateX: number;
  gapY?: number;
  link: HierarchyLink<T>;
  linkColor: string;
  arrowColor: string;
  getLinkWidth: (
    sourceNodeData: T,
    targetNodeData: T,
    metaData?: unknown
  ) => number;
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
  arrowColor,
  getLinkWidth,
}: LinkPathProps<T>) {
  const { linkPaths, arrowPath } = useMemo(() => {
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
    // We start the arrow from the middle of the gap
    const arrowStartY = sourceY + actualSourceYSize + gapY / 2;

    const arrowStrokeWidth = 4;

    // same X:
    // we draw as straight line between the nodes.
    if (sourceX === targetX) {
      return {
        linkPaths: [
          {
            pathDef: `M ${linkStartX} ${linkStartY} V ${linkEndY}`,
            strokeWidth: getLinkWidth(source.data, target.data),
          },
        ],
        arrowPath: target.noChildren
          ? {
              pathDef: `M ${linkStartX} ${arrowStartY} V ${linkEndY}`,
              strokeWidth: arrowStrokeWidth,
            }
          : null,
      };
    }

    // different X: we draw an elbow half way through the bottom of the source
    // node and the top of the target. Each path (top vertical half, horizontal
    // line, bottom vertical half) is a separate path element having different
    // stroke widths
    const sourceBottomY = sourceY + actualSourceYSize;
    const elbowY = sourceBottomY + (targetY - sourceBottomY) / 2;

    const firstVerticalStrokeWidth = getLinkWidth(source.data, target.data, {
      isFirstVerticalHalf: true,
    });
    const shardLinkStrokeWidth = getLinkWidth(source.data, target.data);

    return {
      linkPaths: [
        {
          pathDef: `M ${linkStartX} ${linkStartY} V ${elbowY}`,
          strokeWidth: firstVerticalStrokeWidth,
        },
        {
          pathDef: `M ${linkStartX} ${elbowY} H ${linkEndX}`,
          strokeWidth: shardLinkStrokeWidth,
        },
        {
          pathDef: `M ${linkEndX} ${elbowY - shardLinkStrokeWidth / 2} V ${
            elbowY + elbowY
          }`,
          strokeWidth: shardLinkStrokeWidth,
        },
      ],
    };
  }, [gapY, link.source, link.target, translateX, getLinkWidth]);

  return (
    <>
      {linkPaths.map(({ pathDef, strokeWidth }, idx) => (
        <path
          key={idx}
          className={`path-${idx}`}
          fill="none"
          stroke={linkColor}
          strokeWidth={strokeWidth}
          d={pathDef}
        />
      ))}
      {arrowPath && (
        <path
          fill="none"
          stroke={arrowColor}
          d={arrowPath.pathDef}
          strokeWidth={arrowPath.strokeWidth}
          markerStart="url(#arrowhead)"
        />
      )}
    </>
  );
}

const treeContainerStyles = css({
  position: 'relative',
  margin: '0 auto',
  transformOrigin: 'top left',
  transitionProperty: 'width, height, transform',
  transitionDuration: '0.1s',
  transitionTimingFunction: 'linear',
});

function TreeLayout<T, X>({
  data,
  getNodeSize,
  getNodeKey,
  linkColor,
  getLinkWidth,
  arrowColor,
  horizontalSpacing,
  verticalSpacing,
  children,
  scale = 1,
  ...divProps
}: TreeLayoutProps<T, X>) {
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
      <div
        style={{
          // CSS transforms have no effect on the CSS layout (only on the
          // overflow) and so to allow margin: auto to correctly calculate even
          // center position of the container we are adjusing container size to
          // match the scale
          //
          // @see {@link https://www.w3.org/TR/css-transforms-1/}
          width: width * scale,
          height: height * scale,
          transform: `scale(${scale})`,
        }}
        className={treeContainerStyles}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <marker
              markerWidth="5"
              markerHeight="5"
              refX="9"
              refY="11"
              viewBox="0 0 25 21"
              orient="auto-start-reverse"
              id="arrowhead"
            >
              <polyline
                points="0,15 7.5,7.5 0,0"
                fill="none"
                strokeWidth="4"
                stroke={arrowColor}
                strokeLinecap="round"
                transform="matrix(1,0,0,1,2,3.5)"
                strokeLinejoin="round"
              />
            </marker>
          </defs>
          <g>
            {links.map((link, i) => (
              <LinkPath<T>
                key={i}
                link={link}
                gapY={verticalSpacing}
                translateX={translateX}
                linkColor={linkColor}
                arrowColor={arrowColor}
                getLinkWidth={getLinkWidth as LinkPathProps<T>['getLinkWidth']}
              />
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
