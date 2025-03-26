import React from 'react';
import { type ComponentProps, useEffect } from 'react';
import ReactFlow, {
  Background,
  ConnectionMode,
  type FitViewOptions,
  SelectionMode,
  useEdgesState,
  useNodesState,
} from 'reactflow';

import { ConnectionLine } from '../edges/connection-line';
import { diagramStyle } from './canvas.css';
import { DiagramControls } from '../controls/diagram-controls';
import { DiagramMinimap } from '../controls/diagram-minimap';
import { FloatingEdge } from '../edges/floating-edge';
import 'reactflow/dist/style.css';
import { Markers } from '../markers';
import { TableNode } from '../nodes/table-node';
import { CollectionNode } from '../nodes/collection-node';
import { DimmedNode } from '../nodes/dimmed-node';
import type { Edge, Node } from '../utils/types';
import { css } from '@mongodb-js/compass-components';

const nodeTypes = {
  TABLE: TableNode,
  COLLECTION: CollectionNode,
  DIMMED: DimmedNode,
};

const edgeTypes = {
  floatingStep: FloatingEdge,
};

export const fitViewOptions: FitViewOptions = {
  maxZoom: 1,
  minZoom: 0.25,
};

const multiSelectionKeyCode = ['Meta', 'Control'];

interface Props
  extends Pick<
    ComponentProps<typeof ReactFlow>,
    | 'title'
    | 'onPaneClick'
    | 'panOnDrag'
    | 'onEdgeClick'
    | 'onNodeContextMenu'
    | 'onNodeDragStop'
    | 'onSelectionContextMenu'
    | 'onSelectionDragStop'
    | 'onSelectionChange'
    | 'onConnectStart'
    | 'onConnect'
  > {
  id: string;
  nodes: Node[];
  edges: Edge[];
  isContextMenuOpen?: boolean;
}

const containerStyles = css({
  height: '100%',
  width: '100%',
  // TODO: Background on theme.
});

// const ReactFlowWrapper = css.div`
//   height: 100%;=
//   background: ${props => props.theme.shared.diagram.background};
// `;

export const Canvas = ({
  title,
  nodes: initialNodes,
  edges: initialEdges,
  isContextMenuOpen,
  ...rest
}: Props) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setEdges(initialEdges.map((edge) => ({ ...edge, type: 'floatingStep' })));
  }, [initialEdges]);

  return (
    <div className={containerStyles}>
      <ReactFlow
        title={title}
        onlyRenderVisibleElements
        className={diagramStyle}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineComponent={ConnectionLine}
        connectionMode={ConnectionMode.Loose}
        nodes={nodes}
        deleteKeyCode={null}
        edgeTypes={edgeTypes}
        edges={edges}
        fitViewOptions={fitViewOptions}
        maxZoom={3}
        minZoom={0.1}
        multiSelectionKeyCode={multiSelectionKeyCode}
        nodeTypes={nodeTypes}
        selectionKeyCode={'Shift'}
        selectionMode={SelectionMode.Partial}
        zoomOnPinch={!isContextMenuOpen}
        zoomOnScroll={!isContextMenuOpen}
        {...rest}
      >
        <Background />
        <DiagramControls title={title} />
        <Markers />
        <DiagramMinimap />
      </ReactFlow>
    </div>
  );
};
