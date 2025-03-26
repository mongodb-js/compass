import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { PluginTitle } from './plugin-title';
import SchemaViz from './components';

export const SchemaVizualizationHadronPlugin = registerHadronPlugin({
  name: 'Schema Vizualization' as const,
  component: function SchemaProvider({ children, ...props }) {
    return React.createElement(
      React.Fragment,
      null,
      // Cloning children with props is a workaround for reflux store.
      React.isValidElement(children)
        ? React.cloneElement(children, props)
        : null
    );
  },
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
