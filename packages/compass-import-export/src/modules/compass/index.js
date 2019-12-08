import ns, { nsChanged } from './ns';
import dataService, { dataServiceConnected } from './data-service';
import appRegistry, { appRegistryEmit, appRegistryActivated } from './app-registry';
import globalAppRegistry, {
  globalAppRegistryActivated,
  globalAppRegistryEmit
} from './global-app-registry';

export {
  ns,
  nsChanged,
  dataService,
  dataServiceConnected,
  appRegistry,
  appRegistryActivated,
  appRegistryEmit,
  globalAppRegistry,
  globalAppRegistryActivated,
  globalAppRegistryEmit
};
