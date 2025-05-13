// plugin.tsx
import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';

import { VectorVisualizer } from './components/vector-visualizer';
import { createStore } from 'redux';

// Minimal reducer for the plugin store
function reducer(state = {}, action: any) {
  return state;
}

export const CompassVectorPluginProvider = registerHadronPlugin(
  {
    name: 'CompassVectorEmbeddingVisualizer',
    component: function VectorVisualizerProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: () => {
      const store = createStore(reducer);
      return {
        store: () => store,
        deactivate: () => {
          // ignore
        },
      };
    },
  },
  {
    // collection: collectionModelLocator,
    // dataService: dataServiceLocator,
    logger: createLoggerLocator('COMPASS-VECTOR-VISUALIZER'),
    // track: telemetryLocator,
  }
);

export default CompassVectorPluginProvider;

export const CompassVectorPlugin = {
  name: 'VectorVisualizer',
  type: 'Collection' as const,
  provider: CompassVectorPluginProvider,
  content: VectorVisualizer,
  header: () => React.createElement('div', null, 'Vector Embeddings'),
};
