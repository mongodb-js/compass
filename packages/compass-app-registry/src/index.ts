import { AppRegistry, globalAppRegistry } from './app-registry';
export { AppRegistry, globalAppRegistry };
export {
  AppRegistryProvider,
  useGlobalAppRegistry,
  useLocalAppRegistry,
  GlobalAppRegistryProvider,
} from './react-context';
export type {
  CompassPluginComponent,
  CompassPluginConfig,
  ActivateHelpers,
} from './register-plugin';
export {
  registerCompassPlugin,
  createActivateHelpers,
  createServiceLocator,
  createServiceProvider,
} from './register-plugin';
export type { Plugin as CompassPlugin } from './app-registry';
export default AppRegistry;
