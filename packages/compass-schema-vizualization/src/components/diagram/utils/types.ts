import type { Node as ReactFlowNode } from 'reactflow';

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: EdgeType;
  hidden?: boolean;
  selected?: boolean;
  markerStart?: MarkerStart;
  markerEnd?: MarkerEnd;
}

export type Node = ReactFlowNode<NodeData>;

export interface NodeField {
  name: string;
  description: string;
  depth?: number;
  glyphs?: NodeFieldGlyph[];
  type?: NodeFieldType;
}

export interface NodeData {
  title: string;
  fields: Array<NodeField>;
  height?: number;
  borderColor?: string;
}

export type NodeType = 'TABLE' | 'COLLECTION' | 'DIMMED';
export type NodeFieldType = 'Highlighted' | 'Preview' | 'Dimmed';
export type NodeFieldGlyph = 'Key' | 'Link';
export type MarkerStart = 'START_ONE' | 'START_ONE_OR_MANY';
export type MarkerEnd = 'END_ONE' | 'END_MANY' | 'END_ONE_OR_MANY';
export type EdgeType = 'floating' | 'self';
