// import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { PluginTitle } from './plugin-title';
import SchemaViz from './components';

export const SchemaVizualizationHadronPlugin = registerHadronPlugin({
  name: 'Schema Vizualization' as const,
  component: SchemaViz,
  activate(/* initialProps, services, activateHelpers */) {
    return {
      store: {},
      deactivate: () => {
        //
      },
    };
  },
});

export const SchemaVizualizationPlugin = {
  name: 'SchemaVizualization' as const,
  provider: SchemaVizualizationHadronPlugin,
  content: SchemaViz,
  header: PluginTitle,
};
