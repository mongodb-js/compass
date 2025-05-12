// plugin.tsx
import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { collectionModelLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

import VectorVisualizer from './components/vector-visualizer';

export const CompassVectorPluginProvider = registerHadronPlugin(
  {
    name: 'CompassVectorEmbeddingVisualizer',
    component: function VectorVisualizerProvider({ children }) {
      return <>{children}</>;
    },
    activate: () => {
      return {
        store: () => () => null,
        deactivate: () => {},
      };
    },
  },
  {
    collection: collectionModelLocator,
    dataService: dataServiceLocator,
    logger: createLoggerLocator('COMPASS-VECTOR-VISUALIZER'),
    track: telemetryLocator,
  }
);

export const CompassVectorPlugin = {
  name: 'Vector Embeddings',
  type: 'Collection' as const,
  provider: CompassVectorPluginProvider,
  content: VectorVisualizer,
  header: () => <span>Vector Embeddings</span>,
};
