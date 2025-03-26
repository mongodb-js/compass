import type { ElkExtendedEdge, ElkNode } from 'elkjs';
import ELK from 'elkjs/lib/elk.bundled';
import type { Edge, Node } from './types';
import { ENTITY_CARD_WIDTH } from './utils';

export type LayoutDirection = 'LR' | 'TB' | 'S';

const NODE_SPACING = 100;

const TOP_BOTTOM = {
  'elk.algorithm': 'layered',
  'elk.direction': 'UP',
  'elk.contentAlignment': 'V_CENTER',
  'spacing.nodeNode': `${NODE_SPACING}`,
  'spacing.nodeNodeBetweenLayers': `${NODE_SPACING}`,
};

const LEFT_RIGHT = {
  ...TOP_BOTTOM,
  'elk.direction': 'LEFT',
};

const STAR = {
  'elk.algorithm': 'force',
  'spacing.nodeNode': '50',
};

const getLayoutOptions = (direction: LayoutDirection) => {
  switch (direction) {
    case 'LR':
      return LEFT_RIGHT;
    case 'TB':
      return TOP_BOTTOM;
    case 'S':
      return STAR;
    default:
      return {};
  }
};

export const applyLayout = (
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB'
): Promise<{
  nodes: Node[];
  edges: Edge[];
}> => {
  const transformedEdges = edges.map((edge) => ({
    ...edge,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const elk = new ELK({});

  return elk
    .layout({
      id: 'root',
      children: nodes as ElkNode[],
      layoutOptions: getLayoutOptions(direction),
      edges: transformedEdges as ElkExtendedEdge[],
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
    })
    .then((g) => {
      if (!g) return { nodes: [], edges: [] };
      const nodes =
        (g.children ?? []).map<Node>((node: ElkNode & any) => ({
          ...node,
          position: {
            x: node.x ?? 0,
            y: node.y ?? 0,
          },
        })) ?? [];

      const edges = (g.edges ?? []).map((edge) => ({
        ...edge,
        id: edge.id,
        source: edge.sources?.[0],
        target: edge.targets?.[0],
        type: 'floatingEdge' as any, // TODO: types here
      }));

      return { nodes, edges };
    });
};

export const addNodeToEnd = (node: Node, existingNodes: Node[]) => {
  const right = Math.max(...existingNodes.map((node) => node.position.x));
  const bottom = Math.min(...existingNodes.map((node) => node.position.y));

  const newNode = {
    ...node,
    position: {
      x: right + ENTITY_CARD_WIDTH + NODE_SPACING / 5,
      y: bottom,
    },
  };

  return [...existingNodes, newNode];
};
