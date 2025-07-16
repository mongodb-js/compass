import React from 'react';
import {
  getNodesBounds,
  getViewportForBounds,
  DiagramProvider,
  Diagram,
} from '@mongodb-js/diagramming';
import type { DiagramInstance } from '@mongodb-js/diagramming';
import type { StaticModel } from './data-model-storage';
import ReactDOM from 'react-dom';
import { toPng } from 'html-to-image';
import { rafraf, spacing } from '@mongodb-js/compass-components';
import { raceWithAbort } from '@mongodb-js/compass-utils';

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
      const clonedDef = markerDef.cloneNode(true);
      svg.insertBefore(clonedDef, svg.firstChild);
    }
  });
  markerDef.remove();
}

export async function exportToPng(
  fileName: string,
  diagram: DiagramInstance,
  signal?: AbortSignal
) {
  const dataUri = await raceWithAbort(
    getExportPngDataUri(diagram),
    signal ?? new AbortController().signal
  );
  downloadFile(dataUri, fileName);
}

export function getExportPngDataUri(diagram: DiagramInstance): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const bounds = getNodesBounds(diagram.getNodes());

    const container = document.createElement('div');
    container.setAttribute('data-testid', 'export-diagram-container');
    // Push it out of the viewport
    container.style.position = 'fixed';
    container.style.top = '100vh';
    container.style.left = '100vw';
    container.style.width = `${bounds.width}px`;
    container.style.height = `${bounds.height}px`;
    document.body.appendChild(container);

    const edges = diagram.getEdges();
    const nodes = diagram.getNodes().map((node) => ({
      ...node,
      selected: false, // Dont show selected state (blue border)
    }));

    ReactDOM.render(
      <DiagramProvider>
        <Diagram
          edges={edges}
          nodes={nodes}
          onlyRenderVisibleElements={false}
        />
      </DiagramProvider>,
      container,
      () => {
        // We skip some frames here to ensure that the DOM has fully rendered and React has
        // committed all updates before we try to query for viewport element. Without this,
        // the element may not exist yet or may not have the correct styles etc.
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
            document.body.removeChild(container);
            return reject(new Error('Diagram element not found'));
          }

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
              .catch(reject)
              .finally(() => {
                document.body.removeChild(container);
              });
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

export function downloadFile(
  uri: string,
  fileName: string,
  cleanup?: () => void
) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = uri;
  link.click();
  setTimeout(() => {
    link.remove();
    cleanup?.();
  }, 0);
}
