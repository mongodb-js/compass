import React from 'react';
import type { useDiagram } from '@mongodb-js/diagramming';

export type ReactFlowNode = ReturnType<
  ReturnType<typeof useDiagram>['getNodes']
>[number];
export type ReactFlowEdge = ReturnType<
  ReturnType<typeof useDiagram>['getEdges']
>[number];

export type ExportDiagramContextType = {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  setEdges: (edges: ReactFlowEdge[]) => void;
  setNodes: (nodes: ReactFlowNode[]) => void;
};

export const ExportDiagramContext =
  React.createContext<ExportDiagramContextType>({
    nodes: [],
    edges: [],
    setEdges: () => {
      //
    },
    setNodes: () => {
      //
    },
  });
export const ExportDiagramContextProvider = ExportDiagramContext.Provider;
