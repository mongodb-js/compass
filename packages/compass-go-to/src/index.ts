import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import CompassGoTo from './components/compass-go-to';
import { activatePlugin } from './stores/store';

export const CompassGoToPlugin = registerCompassPlugin(
  {
    name: 'CompassGoTo',
    component: CompassGoTo,
    activate: activatePlugin,
  },
  {
    connections: connectionsLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    workspaces: workspacesServiceLocator,
  }
);
