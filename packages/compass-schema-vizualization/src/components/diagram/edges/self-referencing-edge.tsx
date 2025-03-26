import React from 'react';
import { path } from 'd3-path';
import { useCallback } from 'react';
import type { EdgeProps } from 'reactflow';
import { useStore } from 'reactflow';

import type { Node } from '../utils/types';
import { DEFAULT_NODE_PARAMETERS } from '../utils/utils';
import { Edge } from '../edges/edge';

type Props = Pick<
  EdgeProps,
  'id' | 'source' | 'markerStart' | 'markerEnd' | 'selected' | 'animated'
>;

export const SelfReferencingEdge = ({
  id,
  source,
  markerStart,
  markerEnd,
  selected,
  animated,
}: Props) => {
  const sourceNode = useStore(
    useCallback((store) => store.nodeInternals.get(source), [source])
  ) as Node;

  if (!sourceNode) {
    return null;
  }

  const centerX = (sourceNode.width || DEFAULT_NODE_PARAMETERS.width) / 2;
  const centerY = (sourceNode.height || DEFAULT_NODE_PARAMETERS.height) / 2;

  const markerOffset = 3;

  const width = centerX + 40;
  const leftHeight = 30;
  const rightHeight = centerY + leftHeight;

  const startX = sourceNode.position.x + centerX;
  const startY = sourceNode.position.y - markerOffset;

  const topLeftCornerX = startX;
  const topLeftCornerY = startY - leftHeight;

  const topRightCornerX = startX + width;
  const topRightCornerY = topLeftCornerY;

  const bottomRightCornerX = topRightCornerX;
  const bottomRightCornerY = topRightCornerY + rightHeight;

  const bottomLeftCornerX = topRightCornerX - width + centerX + markerOffset;
  const bottomLeftCornerY = bottomRightCornerY;

  const context = path();
  context.moveTo(startX, startY);
  context.lineTo(topLeftCornerX, topLeftCornerY);
  context.lineTo(topRightCornerX, topLeftCornerY);
  context.lineTo(bottomRightCornerX, bottomRightCornerY);
  context.lineTo(bottomLeftCornerX, bottomLeftCornerY);

  return (
    <Edge
      animated={animated}
      d={context.toString()}
      data-testid={''}
      id={id}
      markerEnd={markerEnd}
      markerStart={markerStart}
      selected={selected}
    />
  );
};
