import { Position } from 'reactflow';
import type { Node } from '../utils/types';
import {
  CONTEXTUAL_ZOOM_BORDER_THICKNESS,
  NORMAL_ZOOM_BORDER_THICKNESS,
} from '../utils/utils';

// ****************************************************************************
// Floating edge implementation taken from https://reactflow.dev/docs/examples/edges/floating-edges/
// ****************************************************************************

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: Node, targetNode: Node) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const {
    width: intersectionNodeWidth = 0,
    data: { height: intersectionNodeHeight = 0 },
    position: intersectionNodePosition,
  } = intersectionNode;

  const targetPosition = targetNode.position;

  const w = (intersectionNodeWidth || 0) / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.width ?? 0) / 2;
  const y1 = targetPosition.y + (targetNode.data.height ?? 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x: Math.round(x), y: Math.round(y) };
}

// returns the position (top,right,bottom or right) passed node compared to the intersection point
export function getEdgePosition(
  node: Node,
  intersectionPoint: { x: number; y: number }
) {
  const n = {
    x: node.position.x,
    y: node.position.y,
    width: node.width,
    height: node.data.height,
  };

  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + (n.width ?? 0) - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + (n.height ?? 0) - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

// Border thickness is not considered in node height calculations, but is required for accurate edge calculations.
const addBorderThicknessToNodeHeight = (
  node: Node,
  isContextualZoom: boolean
) => {
  return {
    ...node,
    data: {
      ...node.data,
      height: isContextualZoom
        ? 45 * CONTEXTUAL_ZOOM_BORDER_THICKNESS
        : 115 * NORMAL_ZOOM_BORDER_THICKNESS,
    },
  };
};

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(
  source: Node,
  target: Node,
  isContextualZoom: boolean
) {
  source = addBorderThicknessToNodeHeight(source, isContextualZoom);
  target = addBorderThicknessToNodeHeight(target, isContextualZoom);

  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  const sourcePosition = offsetPosition(sourcePos, sourceIntersectionPoint);
  const targetPosition = offsetPosition(targetPos, targetIntersectionPoint);

  return {
    sx: sourcePosition.x,
    sy: sourcePosition.y,
    tx: targetPosition.x,
    ty: targetPosition.y,
    sourcePos,
    targetPos,
  };
}

export const offsetPosition = (
  position: Position,
  { x, y }: { x: number; y: number },
  offset = 4
) => {
  switch (position) {
    case Position.Left:
      return { x: x - offset, y };
    case Position.Top:
      return { x, y: y - offset };
    case Position.Right:
      return { x: x + offset, y };
    case Position.Bottom:
      return { x, y: y + offset };
    default:
      return { x, y };
  }
};
