import React from 'react';
import { palette } from '@mongodb-js/compass-components';
import type { ConnectionLineComponentProps } from 'reactflow';
import { getStraightPath } from 'reactflow';
import styled from 'styled-components';

const StyledPath = styled.path`
  animation: 'dashdraw 0.5s linear infinite';
`;

export const ConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) => {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <circle cx={fromX} cy={fromY} fill={palette.blue.base} r={4} />
      <StyledPath
        d={edgePath}
        fill="none"
        stroke={palette.blue.base}
        strokeDasharray={5}
        strokeWidth={2}
      />
    </g>
  );
};
