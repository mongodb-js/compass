import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import DataModelingComponent from './components/data-modeling';
import reducer from './store/reducer';

const DataModelingPlugin = registerHadronPlugin(
  {
    name: 'DataModeling',
    component: DataModelingComponent,
    activate(initialProps, services, { cleanup }) {
      const store = createStore(
        reducer,
        applyMiddleware(thunk.withExtraArgument(services))
      );
      return { store, deactivate: cleanup };
    },
  },
  {
    preferences: preferencesLocator,
    connections: connectionsLocator,
    telemetry: telemetryLocator,
    logger: createLoggerLocator('COMPASS-DATA-MODELING'),
  }
);

export const WorkspaceTab: WorkspaceComponent<'Data Modeling'> = {
  name: 'Data Modeling',
  component: DataModelingPlugin,
};

export default DataModelingPlugin;
