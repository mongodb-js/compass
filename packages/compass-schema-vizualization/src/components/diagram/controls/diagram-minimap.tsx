import React from 'react';
import { palette } from '@mongodb-js/compass-components';
import { MiniMap } from 'reactflow';
import { useTheme } from 'styled-components';

export const DiagramMinimap = () => {
  const theme = useTheme();
  return (
    <MiniMap
      maskColor={theme.shared.diagram.miniMap.mask}
      nodeColor={palette.gray.dark1}
      style={{
        width: 200,
        height: 100,
        background: theme.shared.diagram.miniMap.selectionArea,
      }}
    />
  );
};
