import type { NodeProps, EdgeProps, NodeType } from '@mongodb-js/diagramming';
import type { Node, Edge } from '@xyflow/react';
import type {
  Relationship,
  Collection,
} from '../../services/data-model-storage';
import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { ReactFlowNode } from '../export-diagram-context';

export function mapNodeToNodeProps(node: Node): NodeProps {
  const { data, type, ...restOfNode } = node;
  return {
    ...restOfNode,
    ...data, // Type this
    type: type as NodeType,
  };
}

export function mapEdgeToEdgeProps(edge: Edge): EdgeProps {
  const { markerStart, markerEnd, ...restOfEdge } = edge;
  // For an edge to exist, there must be a relationship
  if (!markerStart || !markerEnd) {
    throw new Error('Unexpected edge without markers');
  }

  // The diagramming package only allows string based markers
  if (typeof markerStart !== 'string' || typeof markerEnd !== 'string') {
    throw new Error('Unexpected edge with non-string markers');
  }

  return {
    ...restOfEdge,
    markerEnd: markerEnd.replace('end-', '') as EdgeProps['markerEnd'],
    markerStart: markerStart.replace('start-', '') as EdgeProps['markerStart'],
  };
}

export function mapCollectionToNodeProps(coll: Collection): NodeProps {
  return {
    id: coll.ns,
    type: 'collection',
    position: {
      x: coll.displayPosition[0],
      y: coll.displayPosition[1],
    },
    title: coll.ns,
    fields: Object.entries(coll.jsonSchema.properties ?? {}).map(
      ([name, field]) => {
        const type =
          field.bsonType === undefined
            ? 'Unknown'
            : typeof field.bsonType === 'string'
            ? field.bsonType
            : // TODO: Show possible types of the field
              field.bsonType[0];
        return {
          name,
          type,
          glyphs: type === 'objectId' ? ['key'] : [],
        };
      }
    ),
    measured: {
      width: 100,
      height: 200,
    },
  };
}

export function mapRelationshipToEdgeProps(
  relationship: Relationship
): EdgeProps {
  const [source, target] = relationship.relationship;
  return {
    id: relationship.id,
    source: source.ns,
    target: target.ns,
    markerStart: source.cardinality === 1 ? 'one' : 'many',
    markerEnd: target.cardinality === 1 ? 'one' : 'many',
  };
}

export async function getPngDataUrl(
  containerRef: React.RefObject<HTMLDivElement>,
  nodes: ReactFlowNode[]
): Promise<string> {
  if (!containerRef.current) {
    throw new Error('Container reference is not set');
  }
  const diagramElement = containerRef.current.querySelector(
    '.react-flow__viewport'
  );
  if (!diagramElement) {
    throw new Error('Diagram element not found');
  }

  const padding = '20px';
  const bounds = getNodesBounds(nodes);
  const transform = getViewportForBounds(
    bounds,
    bounds.width,
    bounds.height,
    0.5,
    2,
    padding
  );

  const uri = await toPng(diagramElement as HTMLElement, {
    backgroundColor: '#fff',
    pixelRatio: 2,
    width: bounds.width,
    height: bounds.height,
    style: {
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    },
  });
  return uri;
}

export function getDiagramJsonSchema(data: unknown) {
  // TODO: Implement this function to return the JSON schema for the diagram
  return data;
}

export function downloadImage(dataUrl: string, filename = 'diagram.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function downloadJsonSchema(
  jsonSchema: unknown,
  filename = 'diagram.json'
): void {
  const blob = new Blob([JSON.stringify(jsonSchema, null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
}
