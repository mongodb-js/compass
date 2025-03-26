import { spacing } from '@mongodb-js/compass-components';
import type { Node } from 'reactflow';
import type { MarkerEnd, MarkerStart } from '../utils/types';
export const ENTITY_CARD_HEADER_HEIGHT = 28;

export const DEFAULT_NODE_PARAMETERS = {
  width: 244,
  position: { x: 0, y: 0 },
  type: 'entityCard',
  height: 80,
  hidden: false,
};
export const ENTITY_CARD_ROW_HEIGHT = 18;
export const ENTITY_CARD_WIDTH = 244;

export const ENTITY_SINGLE_ICON_WIDTH = spacing[3];

export const NORMAL_ZOOM_BORDER_THICKNESS = 1;
export const CONTEXTUAL_ZOOM_BORDER_THICKNESS = 2;

export const createEdgeKey = (
  nodeNameA?: string,
  nodeNameB?: string
): string => {
  if (!nodeNameA || !nodeNameB) return '';
  const sortedNames = [nodeNameA, nodeNameB].sort();
  return sortedNames.join('-');
};

export const getUpdateNodePositionFromNode = ({
  id,
  data,
  position,
}: Node): any => ({
  nodeId: id,
  nodeType: data.type,
  position,
});

export const getMarkerId = (
  isSelected?: boolean,
  marker?: MarkerEnd | MarkerStart
) => {
  return `${marker}${isSelected ? '_SELECTED' : ''}`;
};
