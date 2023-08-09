import { AppRegistry } from './app-registry';
import type { Role } from './app-registry';
export { AppRegistry };
export type { Role };
export {
  registerHadronPlugin,
  HadronPlugin,
  HadronRole,
  globalAppRegistry,
  GlobalAppRegistryProvider,
  registerGlobalAppRegistryEventEmitter,
} from './react';
export default AppRegistry;
