import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { collectionModelLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { createStore } from 'redux';

import { VectorVisualizer } from './components/vector-visualizer';

function reducer(state = {}, _action: any) {
  return state;
}

export const CompassVectorPluginProvider = registerHadronPlugin<
  { dataService: any; collection: any },
  any,
  any
>(
  {
    name: 'CompassVectorEmbeddingVisualizer',
    component: function VectorVisualizerProvider({
      dataService,
      collection,
      children,
    }) {
      return React.createElement(
        VectorVisualizer,
        { dataService, collection },
        children
      );
    },
    activate: () => {
      const store = createStore(reducer);
      return {
        store: () => store,
        deactivate: () => {},
      };
    },
  },
  {
    dataService: dataServiceLocator,
    collection: collectionModelLocator,
    logger: createLoggerLocator('COMPASS-VECTOR-VISUALIZER'),
  }
);

export const CompassVectorPlugin = {
  name: 'VectorVisualizer',
  type: 'CollectionTab' as const,
  provider: CompassVectorPluginProvider,
  content: VectorVisualizer,
  header: () => React.createElement('div', null, 'Vector Embeddings'),
};

export default CompassVectorPluginProvider;
