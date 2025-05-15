import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { collectionModelLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { createStore } from 'redux';

import { VectorVisualizer } from './components/vector-visualizer';
import { activateVectorPlugin } from './stores/store';

function reducer(state = {}, _action: any) {
  return state;
}

export const CompassVectorPluginProvider = registerHadronPlugin(
  {
    name: 'CompassVectorEmbeddingVisualizer',
    component: function VectorVisualizerProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateVectorPlugin,
  },
  {
    dataService: dataServiceLocator,
    collection: collectionModelLocator,
    logger: createLoggerLocator('COMPASS-VECTOR-VISUALIZER'),
  }
);

const VectorVisualizerWrapper = (props: {
  dataService: any;
  collection: any;
}) => {
  return React.createElement(VectorVisualizer, props);
};

export const CompassVectorPlugin = {
  name: 'Vector Visualizer' as const,
  type: 'CollectionTab' as const,
  provider: CompassVectorPluginProvider,
  content: VectorVisualizerWrapper,
  header: () => React.createElement('div', null, 'Vector Embeddings'),
};

export default CompassVectorPluginProvider;
