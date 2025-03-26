import React from 'react';
import { useCallback } from 'react';
import type { EdgeProps } from 'reactflow';
import { getSmoothStepPath, useStore, useViewport } from 'reactflow';

import { ZOOM_THRESHOLD } from '../nodes/entity-card';
import type { Node } from '../utils/types';
import { Edge } from '../edges/edge';
import { getEdgeParams } from '../edges/floating-edge-utils';
import { SelfReferencingEdge } from '../edges/self-referencing-edge';

export const FloatingEdge = ({
  id,
  source,
  target,
  markerStart,
  markerEnd,
  selected,
  animated,
}: EdgeProps) => {
  const { zoom } = useViewport();
  const isContextualZoom = zoom < ZOOM_THRESHOLD;

  if (source === target) {
    return (
      <SelfReferencingEdge
        id={id}
        source={source}
        markerStart={markerStart}
        markerEnd={markerEnd}
        selected={selected}
        animated={animated}
      />
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sourceNode = useStore(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback((store) => store.nodeInternals.get(source), [source])
  ) as Node;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const targetNode = useStore(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback((store) => store.nodeInternals.get(target), [target])
  ) as Node;

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
    isContextualZoom
  );

  const [d] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <Edge
      animated={animated}
      d={d}
      data-testid={''}
      id={id}
      markerEnd={markerEnd}
      markerStart={markerStart}
      selected={selected}
    />
  );
};
