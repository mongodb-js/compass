import React from 'react';
import { palette } from '@mongodb-js/compass-components';
import type { EdgeProps as ReactFlowEdgeProps } from 'reactflow';

export const getMarker = (selected?: boolean, marker?: string) => {
  return selected ? marker?.replace(/'\)/, "_SELECTED')") : marker;
};

interface EdgeProps
  extends Pick<
    ReactFlowEdgeProps,
    'id' | 'markerEnd' | 'markerStart' | 'selected' | 'animated'
  > {
  d: string;
  'data-testid': string;
}

export const Edge = ({
  animated,
  d,
  'data-testid': dataTestId,
  id,
  markerEnd,
  markerStart,
  selected,
}: EdgeProps) => {
  if (animated) {
    return (
      <path
        className="react-flow__edge-path"
        d={d}
        data-testid={dataTestId}
        id={id}
        markerEnd={getMarker(selected, markerEnd)}
        markerStart={getMarker(selected, markerStart)}
        style={{ stroke: palette.blue.base, pointerEvents: 'none' }}
      />
    );
  }

  return (
    <>
      <path
        className="react-flow__edge-path"
        d={d}
        data-testid={dataTestId}
        id={id}
        markerEnd={getMarker(selected, markerEnd)}
        markerStart={getMarker(selected, markerStart)}
        style={
          // Needed to use a style for this because of specificity purposes. The react-flow__edge-path class was taking preference over other classes.
          selected
            ? { stroke: palette.blue.base }
            : { stroke: palette.gray.base }
        }
      />
      <path // This additional path is an 'invisible' edge that makes it easier for the edge to be clicked
        d={d}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
      />
    </>
  );
};
