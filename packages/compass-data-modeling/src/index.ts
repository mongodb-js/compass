import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import DataModelingComponent from './components/data-modeling';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataModelStorageServiceLocator } from './provider';
import { activateDataModelingStore } from './store';

const DataModelingPlugin = registerHadronPlugin(
  {
    name: 'DataModeling',
    component: DataModelingComponent,
    activate: activateDataModelingStore,
  },
  {
    preferences: preferencesLocator,
    connections: connectionsLocator,
    instanceManager: mongoDBInstancesManagerLocator,
    dataModelStorage: dataModelStorageServiceLocator,
    track: telemetryLocator,
    logger: createLoggerLocator('COMPASS-DATA-MODELING'),
  }
);

export const WorkspaceTab: WorkspaceComponent<'Data Modeling'> = {
  name: 'Data Modeling',
  component: DataModelingPlugin,
};

export default DataModelingPlugin;
