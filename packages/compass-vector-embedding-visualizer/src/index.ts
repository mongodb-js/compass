import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { collectionModelLocator } from '@mongodb-js/compass-app-stores/provider';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';

import VectorVisualizer from './components/vector-visualizer';
import { VectorsTabTitle } from './plugin-tab-title';
import {
  activateVectorPlugin,
  type VectorDataServiceProps,
} from './stores/store';

export const CompassVectorPluginProvider = registerHadronPlugin(
  {
    name: 'CompassVectorEmbeddingVisualizer',
    component: function VectorVisualizerProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateVectorPlugin,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<VectorDataServiceProps>,
    collection: collectionModelLocator,
    logger: createLoggerLocator('COMPASS-VECTOR-VISUALIZER'),
  }
);

// const VectorVisualizerWrapper = (props: {
//   dataService: any;
//   collection: any;
// }) => {
//   return React.createElement(VectorVisualizer, props);
// };

export const CompassVectorPlugin = {
  name: 'Vector Visualizer' as const,
  provider: CompassVectorPluginProvider,
  content: VectorVisualizer, // VectorVisualizerWrapper,
  header: VectorsTabTitle,
};

export default CompassVectorPluginProvider;
