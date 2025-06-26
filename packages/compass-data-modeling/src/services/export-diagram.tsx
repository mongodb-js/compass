import React from 'react';
import {
  getNodesBounds,
  getViewportForBounds,
  DiagramProvider,
  Diagram,
} from '@mongodb-js/diagramming';
import type {
  useDiagram,
  NodeProps,
  NodeType,
  EdgeProps,
  Marker,
} from '@mongodb-js/diagramming';
import type { StaticModel } from './data-model-storage';
import ReactDOM from 'react-dom';
import { toPng } from 'html-to-image';
import { rafraf, spacing } from '@mongodb-js/compass-components';

// TODO: Export these methods (and type) from the diagramming package
type DiagramInstance = ReturnType<typeof useDiagram>;
function mapNodeToDiagramNode(
  node: ReturnType<DiagramInstance['getNodes']>[number]
): NodeProps {
  const { data, type, ...restOfNode } = node;
  return {
    ...restOfNode,
    ...(data as any), // TODO: Type data (or expose these methods from the diagramming package)
    type: type as NodeType,
  };
}
function mapEdgeToDiagramEdge(
  edge: ReturnType<DiagramInstance['getEdges']>[number]
): EdgeProps {
  const { markerStart, markerEnd, ...restOfEdge } = edge;

  // The diagramming package only allows string based markers
  if (typeof markerStart !== 'string' || typeof markerEnd !== 'string') {
    throw new Error('Unexpected edge with non-string markers');
  }

  return {
    ...restOfEdge,
    markerEnd: markerEnd.replace('end-', '') as Marker,
    markerStart: markerStart.replace('start-', '') as Marker,
  };
}

function moveSvgDefsToViewportElement(
  container: Element,
  targetElement: Element
) {
  const markerDef = container.querySelector('svg defs');
  if (!markerDef) {
    return;
  }
  const diagramSvgElements = targetElement.querySelectorAll('svg');
  diagramSvgElements.forEach((svg) => {
    const pathsWithMarkers = svg.querySelectorAll(
      'path[marker-end], path[marker-start]'
    );
    if (pathsWithMarkers.length !== 0) {
      const clonedDef = markerDef.cloneNode(true) as SVGMarkerElement;
      svg.insertBefore(clonedDef, svg.firstChild);
    }
  });
  markerDef.remove();
}

export async function exportToPng(
  fileName: string,
  containerRef: React.RefObject<HTMLDivElement>,
  diagram: DiagramInstance
) {
  const container = containerRef.current;
  if (!container) {
    throw new Error('Container reference is not set');
  }
  const dataUri = await getExportPngDataUri(container, diagram);
  downloadFile(dataUri, fileName, () => {
    ReactDOM.unmountComponentAtNode(container);
  });
}

export function getExportPngDataUri(
  container: HTMLDivElement,
  diagram: DiagramInstance
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const nodes = diagram.getNodes();
    const edges = diagram.getEdges();
    ReactDOM.render(
      <DiagramProvider>
        <Diagram
          edges={edges.map(mapEdgeToDiagramEdge)}
          nodes={nodes.map(mapNodeToDiagramNode)}
          onlyRenderVisibleElements={false}
        />
      </DiagramProvider>,
      container,
      () => {
        rafraf(() => {
          // For export we are selecting react-flow__viewport element,
          // which contains the export canvas. It excludes diagram
          // title, minmap, and other UI elements. However, it also
          // excludes the svg defs that are currently outside of this element.
          // So, when exporting, we need to include those defs as well so that
          // edge markers are exported correctly.
          const viewportElement = container.querySelector(
            '.react-flow__viewport'
          );
          if (!viewportElement) {
            throw new Error('Diagram element not found');
          }

          const bounds = getNodesBounds(nodes);
          const transform = getViewportForBounds(
            bounds,
            bounds.width,
            bounds.height,
            0.5, // Minimum zoom
            2, // Maximum zoom
            `${spacing[400]}px` // 16px padding
          );
          // Moving svg defs to the viewport element
          moveSvgDefsToViewportElement(container, viewportElement);
          rafraf(() => {
            toPng(viewportElement as HTMLElement, {
              backgroundColor: '#fff',
              pixelRatio: 2,
              width: bounds.width,
              height: bounds.height,
              style: {
                width: `${bounds.width}px`,
                height: `${bounds.height}px`,
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
              },
            })
              .then(resolve)
              .catch(reject);
          });
        });
      }
    );
  });
}

export function exportToJson(fileName: string, model: StaticModel) {
  const json = getExportJsonFromModel(model);
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: 'application/json',
  });
  const url = window.URL.createObjectURL(blob);
  downloadFile(url, fileName, () => {
    window.URL.revokeObjectURL(url);
  });
}

export function getExportJsonFromModel({
  collections,
  relationships,
}: StaticModel) {
  return {
    collections: Object.fromEntries(
      collections.map((collection) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ns, jsonSchema, ...ignoredProps } = collection;
        return [ns, { ns, jsonSchema }];
      })
    ),
    relationships,
  };
}

function downloadFile(uri: string, fileName: string, cleanup: () => void) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = uri;
  link.click();
  setTimeout(() => {
    link.remove();
    cleanup();
  }, 0);
}
