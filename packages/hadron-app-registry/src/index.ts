import { AppRegistry, globalAppRegistry } from './app-registry';
import type { Role } from './app-registry';
export { AppRegistry, globalAppRegistry };
export type { Role };
export {
  AppRegistryProvider,
  useGlobalAppRegistry,
  useLocalAppRegistry,
} from './react-context';
export type {
  HadronPluginComponent,
  HadronPluginConfig,
  ActivateHelpers,
} from './register-plugin';
export { registerHadronPlugin } from './register-plugin';
export default AppRegistry;
